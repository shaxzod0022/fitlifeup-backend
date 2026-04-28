'use strict';

const { ForbiddenError, UnprocessableError, NotFoundError } = require('../../../src/utils/errors');

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockWorkoutSet = (overrides = {}) => ({
  id: 'set-1',
  name: 'Morning Routine',
  visibility: 'private',
  creatorId: 'user-1',
  __total_time__: 10,
  ...overrides,
});

const mockProgram = (overrides = {}) => ({
  id: 'prog-1',
  name: 'Beginner Program',
  visibility: 'private',
  creatorId: 'user-1',
  __total_time__: 0,
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  destroy: jest.fn(async () => {}),
  ...overrides,
});

// ─── Mock model functions ─────────────────────────────────────────────────────

const mockProgramCreate = jest.fn();
const mockProgramFindByPk = jest.fn();
const mockProgramFindAll = jest.fn();
const mockProgramSetBulkCreate = jest.fn();
const mockProgramSetDestroy = jest.fn();
const mockWorkoutSetFindAll = jest.fn();

jest.mock('../../../src/models/index', () => ({
  WorkoutProgram: {
    create: (...args) => mockProgramCreate(...args),
    findByPk: (...args) => mockProgramFindByPk(...args),
    findAll: (...args) => mockProgramFindAll(...args),
  },
  ProgramSet: {
    bulkCreate: (...args) => mockProgramSetBulkCreate(...args),
    destroy: (...args) => mockProgramSetDestroy(...args),
  },
  WorkoutSet: {
    findAll: (...args) => mockWorkoutSetFindAll(...args),
  },
  SetItem: {},
  Exercise: {},
}));

const {
  calculateProgramTotalTime,
  createProgram,
  updateProgram,
  deleteProgram,
} = require('../../../src/services/programs.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('programs.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── calculateProgramTotalTime ───────────────────────────────────────────────

  describe('calculateProgramTotalTime', () => {
    it('returns 0 for an empty array', () => {
      expect(calculateProgramTotalTime([])).toBe(0);
    });

    it('returns 0 for null/undefined input', () => {
      expect(calculateProgramTotalTime(null)).toBe(0);
      expect(calculateProgramTotalTime(undefined)).toBe(0);
    });

    it('returns the __total_time__ of a single set', () => {
      const sets = [mockWorkoutSet({ __total_time__: 15 })];
      expect(calculateProgramTotalTime(sets)).toBe(15);
    });

    it('returns the correct sum of __total_time__ across multiple sets', () => {
      const sets = [
        mockWorkoutSet({ id: 'set-1', __total_time__: 10 }),
        mockWorkoutSet({ id: 'set-2', __total_time__: 20 }),
        mockWorkoutSet({ id: 'set-3', __total_time__: 5 }),
      ];
      expect(calculateProgramTotalTime(sets)).toBe(35);
    });

    it('treats missing __total_time__ as 0', () => {
      const sets = [
        { id: 'set-1' },
        mockWorkoutSet({ id: 'set-2', __total_time__: 12 }),
      ];
      expect(calculateProgramTotalTime(sets)).toBe(12);
    });
  });

  // ── createProgram ───────────────────────────────────────────────────────────

  describe('createProgram', () => {
    it('throws UnprocessableError (422) when a set is private and belongs to another user', async () => {
      const privateSet = mockWorkoutSet({
        id: 'set-private',
        visibility: 'private',
        creatorId: 'other-user',
      });

      mockWorkoutSetFindAll.mockResolvedValue([privateSet]);

      const data = {
        name: 'My Program',
        sets: ['set-private'],
      };

      const err = await createProgram('user-1', data).catch((e) => e);

      expect(err).toBeInstanceOf(UnprocessableError);
      expect(err.statusCode).toBe(422);
    });

    it('creates a program successfully when set is public and belongs to another user', async () => {
      const publicSet = mockWorkoutSet({
        id: 'set-public',
        visibility: 'public',
        creatorId: 'other-user',
        __total_time__: 20,
      });

      mockWorkoutSetFindAll.mockResolvedValue([publicSet]);

      const createdProgram = mockProgram({ id: 'prog-new', creatorId: 'user-1' });
      mockProgramCreate.mockResolvedValue(createdProgram);
      mockProgramSetBulkCreate.mockResolvedValue([]);

      const programWithSets = mockProgram({ id: 'prog-new', creatorId: 'user-1', programSets: [] });
      mockProgramFindByPk.mockResolvedValue(programWithSets);

      const data = { name: 'My Program', sets: ['set-public'] };
      const result = await createProgram('user-1', data);

      expect(mockProgramCreate).toHaveBeenCalledWith(expect.objectContaining({ creatorId: 'user-1' }));
      expect(result).toBeDefined();
    });

    it('creates a program successfully when set belongs to the requesting user (private)', async () => {
      const ownPrivateSet = mockWorkoutSet({
        id: 'set-own',
        visibility: 'private',
        creatorId: 'user-1',
        __total_time__: 10,
      });

      mockWorkoutSetFindAll.mockResolvedValue([ownPrivateSet]);

      const createdProgram = mockProgram({ id: 'prog-new', creatorId: 'user-1' });
      mockProgramCreate.mockResolvedValue(createdProgram);
      mockProgramSetBulkCreate.mockResolvedValue([]);

      const programWithSets = mockProgram({ id: 'prog-new', creatorId: 'user-1', programSets: [] });
      mockProgramFindByPk.mockResolvedValue(programWithSets);

      const data = { name: 'My Program', sets: ['set-own'] };
      const result = await createProgram('user-1', data);

      expect(mockProgramCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── updateProgram ───────────────────────────────────────────────────────────

  describe('updateProgram', () => {
    it('throws ForbiddenError (403) when the program belongs to another user', async () => {
      const otherUsersProgram = mockProgram({ creatorId: 'other-user' });
      mockProgramFindByPk.mockResolvedValue(otherUsersProgram);

      const err = await updateProgram('user-1', 'prog-1', { name: 'Updated' }).catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('throws NotFoundError when the program does not exist', async () => {
      mockProgramFindByPk.mockResolvedValue(null);

      await expect(updateProgram('user-1', 'missing', {})).rejects.toThrow(NotFoundError);
    });

    it('updates the program when the user is the owner', async () => {
      const ownProgram = mockProgram({ creatorId: 'user-1' });
      const updatedProgramWithSets = mockProgram({ creatorId: 'user-1', name: 'Updated', programSets: [] });

      mockProgramFindByPk
        .mockResolvedValueOnce(ownProgram)
        .mockResolvedValueOnce(updatedProgramWithSets);

      const result = await updateProgram('user-1', 'prog-1', { name: 'Updated' });

      expect(ownProgram.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(result).toBeDefined();
    });
  });

  // ── deleteProgram ───────────────────────────────────────────────────────────

  describe('deleteProgram', () => {
    it('throws ForbiddenError (403) when the program belongs to another user', async () => {
      const otherUsersProgram = mockProgram({ creatorId: 'other-user' });
      mockProgramFindByPk.mockResolvedValue(otherUsersProgram);

      const err = await deleteProgram('user-1', 'prog-1').catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('throws NotFoundError when the program does not exist', async () => {
      mockProgramFindByPk.mockResolvedValue(null);

      await expect(deleteProgram('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    it('deletes the program when the user is the owner', async () => {
      const ownProgram = mockProgram({ creatorId: 'user-1' });
      mockProgramFindByPk.mockResolvedValue(ownProgram);

      const result = await deleteProgram('user-1', 'prog-1');

      expect(ownProgram.destroy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
