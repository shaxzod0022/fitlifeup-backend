'use strict';

const { Op } = require('sequelize');
const { NotFoundError, ForbiddenError } = require('../../../src/utils/errors');

// ─── Mock Exercise model ──────────────────────────────────────────────────────

const mockExercise = (overrides = {}) => ({
  id: 'ex-1',
  name: 'Push-up',
  visibility: 'private',
  creatorId: 'user-1',
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  destroy: jest.fn(async () => {}),
  ...overrides,
});

const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindByPk = jest.fn();

jest.mock('../../../src/models/index', () => ({
  Exercise: {
    create: (...args) => mockCreate(...args),
    findAll: (...args) => mockFindAll(...args),
    findByPk: (...args) => mockFindByPk(...args),
  },
}));

const {
  createExercise,
  listExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
} = require('../../../src/services/exercises.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('exercises.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createExercise ──────────────────────────────────────────────────────────

  describe('createExercise', () => {
    it('saves exercise with creatorId = userId and returns it', async () => {
      const created = mockExercise({ creatorId: 'user-1' });
      mockCreate.mockResolvedValue(created);

      const result = await createExercise('user-1', { name: 'Push-up' });

      expect(mockCreate).toHaveBeenCalledWith({ name: 'Push-up', creatorId: 'user-1' });
      expect(result).toBe(created);
    });
  });

  // ── listExercises ───────────────────────────────────────────────────────────

  describe('listExercises', () => {
    it('queries public exercises OR own exercises', async () => {
      const list = [mockExercise({ visibility: 'public', creatorId: 'admin' })];
      mockFindAll.mockResolvedValue(list);

      const result = await listExercises('user-1');

      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              { visibility: 'public' },
              { creatorId: 'user-1' },
            ]),
          }),
        })
      );
      expect(result).toBe(list);
    });
  });

  // ── getExerciseById ─────────────────────────────────────────────────────────

  describe('getExerciseById', () => {
    it('returns exercise when it belongs to the user', async () => {
      const ex = mockExercise({ creatorId: 'user-1', visibility: 'private' });
      mockFindByPk.mockResolvedValue(ex);

      const result = await getExerciseById('user-1', 'ex-1');
      expect(result).toBe(ex);
    });

    it('returns public exercise belonging to another user', async () => {
      const ex = mockExercise({ creatorId: 'admin', visibility: 'public' });
      mockFindByPk.mockResolvedValue(ex);

      const result = await getExerciseById('user-1', 'ex-1');
      expect(result).toBe(ex);
    });

    it('throws NotFoundError when exercise does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(getExerciseById('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError (403) for private exercise of another user', async () => {
      const ex = mockExercise({ creatorId: 'other-user', visibility: 'private' });
      mockFindByPk.mockResolvedValue(ex);

      const err = await getExerciseById('user-1', 'ex-1').catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });

  // ── updateExercise ──────────────────────────────────────────────────────────

  describe('updateExercise', () => {
    it('updates and returns exercise when user is the owner', async () => {
      const ex = mockExercise({ creatorId: 'user-1' });
      mockFindByPk.mockResolvedValue(ex);

      const result = await updateExercise('user-1', 'ex-1', { name: 'Squat' });

      expect(ex.update).toHaveBeenCalledWith({ name: 'Squat' });
      expect(result).toBe(ex);
    });

    it('throws NotFoundError when exercise does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(updateExercise('user-1', 'missing', {})).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError (403) when user is not the owner', async () => {
      const ex = mockExercise({ creatorId: 'other-user' });
      mockFindByPk.mockResolvedValue(ex);

      const err = await updateExercise('user-1', 'ex-1', {}).catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });

  // ── deleteExercise ──────────────────────────────────────────────────────────

  describe('deleteExercise', () => {
    it('deletes exercise when user is the owner and returns nothing', async () => {
      const ex = mockExercise({ creatorId: 'user-1' });
      mockFindByPk.mockResolvedValue(ex);

      const result = await deleteExercise('user-1', 'ex-1');

      expect(ex.destroy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('throws NotFoundError when exercise does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(deleteExercise('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError (403) when user is not the owner', async () => {
      const ex = mockExercise({ creatorId: 'other-user' });
      mockFindByPk.mockResolvedValue(ex);

      const err = await deleteExercise('user-1', 'ex-1').catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });
});
