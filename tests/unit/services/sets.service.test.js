'use strict';

const { ForbiddenError, UnprocessableError, NotFoundError } = require('../../../src/utils/errors');

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockWorkoutSet = (overrides = {}) => ({
  id: 'set-1',
  name: 'Morning Routine',
  visibility: 'private',
  creatorId: 'user-1',
  items: [],
  __total_time__: 0,
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  destroy: jest.fn(async () => {}),
  ...overrides,
});

const mockExerciseRecord = (overrides = {}) => ({
  id: 'ex-1',
  name: 'Push-up',
  visibility: 'public',
  creatorId: 'user-1',
  time: 1,
  ...overrides,
});

// ─── Mock model functions ─────────────────────────────────────────────────────

const mockSetCreate = jest.fn();
const mockSetFindByPk = jest.fn();
const mockSetFindAll = jest.fn();
const mockSetItemBulkCreate = jest.fn();
const mockSetItemDestroy = jest.fn();
const mockExerciseFindAll = jest.fn();

jest.mock('../../../src/models/index', () => ({
  WorkoutSet: {
    create: (...args) => mockSetCreate(...args),
    findByPk: (...args) => mockSetFindByPk(...args),
    findAll: (...args) => mockSetFindAll(...args),
  },
  SetItem: {
    bulkCreate: (...args) => mockSetItemBulkCreate(...args),
    destroy: (...args) => mockSetItemDestroy(...args),
  },
  Exercise: {
    findAll: (...args) => mockExerciseFindAll(...args),
  },
}));

const { createSet, updateSet, deleteSet } = require('../../../src/services/sets.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('sets.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createSet ───────────────────────────────────────────────────────────────

  describe('createSet', () => {
    it('throws UnprocessableError (422) when an exercise is private and belongs to another user', async () => {
      // Exercise is private and owned by a different user
      const privateExercise = mockExerciseRecord({
        id: 'ex-private',
        visibility: 'private',
        creatorId: 'other-user',
      });

      mockExerciseFindAll.mockResolvedValue([privateExercise]);

      const data = {
        name: 'My Set',
        items: [{ exerciseId: 'ex-private', count: 3, break: 30, repeats: 2 }],
      };

      const err = await createSet('user-1', data).catch((e) => e);

      expect(err).toBeInstanceOf(UnprocessableError);
      expect(err.statusCode).toBe(422);
    });

    it('creates a set successfully when exercise is public and belongs to another user', async () => {
      const publicExercise = mockExerciseRecord({
        id: 'ex-public',
        visibility: 'public',
        creatorId: 'other-user',
      });

      mockExerciseFindAll.mockResolvedValue([publicExercise]);

      const createdSet = mockWorkoutSet({ id: 'set-new', creatorId: 'user-1' });
      mockSetCreate.mockResolvedValue(createdSet);
      mockSetItemBulkCreate.mockResolvedValue([]);

      // findByPk called after creation to load set with items
      const setWithItems = mockWorkoutSet({
        id: 'set-new',
        creatorId: 'user-1',
        items: [{ exerciseId: 'ex-public', count: 3, break: 30, repeats: 2, exercise: publicExercise }],
      });
      mockSetFindByPk.mockResolvedValue(setWithItems);

      const data = {
        name: 'My Set',
        items: [{ exerciseId: 'ex-public', count: 3, break: 30, repeats: 2 }],
      };

      const result = await createSet('user-1', data);

      expect(mockSetCreate).toHaveBeenCalledWith(expect.objectContaining({ creatorId: 'user-1' }));
      expect(result).toBeDefined();
    });

    it('creates a set successfully when exercise belongs to the requesting user (private)', async () => {
      const ownPrivateExercise = mockExerciseRecord({
        id: 'ex-own',
        visibility: 'private',
        creatorId: 'user-1',
      });

      mockExerciseFindAll.mockResolvedValue([ownPrivateExercise]);

      const createdSet = mockWorkoutSet({ id: 'set-new', creatorId: 'user-1' });
      mockSetCreate.mockResolvedValue(createdSet);
      mockSetItemBulkCreate.mockResolvedValue([]);

      const setWithItems = mockWorkoutSet({
        id: 'set-new',
        creatorId: 'user-1',
        items: [{ exerciseId: 'ex-own', count: 1, break: 0, repeats: 1, exercise: ownPrivateExercise }],
      });
      mockSetFindByPk.mockResolvedValue(setWithItems);

      const data = {
        name: 'My Set',
        items: [{ exerciseId: 'ex-own', count: 1, break: 0, repeats: 1 }],
      };

      const result = await createSet('user-1', data);

      expect(mockSetCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── updateSet ───────────────────────────────────────────────────────────────

  describe('updateSet', () => {
    it('throws ForbiddenError (403) when the set belongs to another user', async () => {
      const otherUsersSet = mockWorkoutSet({ creatorId: 'other-user' });
      mockSetFindByPk.mockResolvedValue(otherUsersSet);

      const err = await updateSet('user-1', 'set-1', { name: 'Updated' }).catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('throws NotFoundError when the set does not exist', async () => {
      mockSetFindByPk.mockResolvedValue(null);

      await expect(updateSet('user-1', 'missing', {})).rejects.toThrow(NotFoundError);
    });

    it('updates the set when the user is the owner', async () => {
      const ownSet = mockWorkoutSet({ creatorId: 'user-1' });
      // First findByPk call returns the set for ownership check
      // Second findByPk call returns the updated set with items
      const updatedSetWithItems = mockWorkoutSet({ creatorId: 'user-1', name: 'Updated', items: [] });
      mockSetFindByPk
        .mockResolvedValueOnce(ownSet)
        .mockResolvedValueOnce(updatedSetWithItems);

      const result = await updateSet('user-1', 'set-1', { name: 'Updated' });

      expect(ownSet.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(result).toBeDefined();
    });
  });

  // ── deleteSet ───────────────────────────────────────────────────────────────

  describe('deleteSet', () => {
    it('throws ForbiddenError (403) when the set belongs to another user', async () => {
      const otherUsersSet = mockWorkoutSet({ creatorId: 'other-user' });
      mockSetFindByPk.mockResolvedValue(otherUsersSet);

      const err = await deleteSet('user-1', 'set-1').catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('throws NotFoundError when the set does not exist', async () => {
      mockSetFindByPk.mockResolvedValue(null);

      await expect(deleteSet('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    it('deletes the set when the user is the owner', async () => {
      const ownSet = mockWorkoutSet({ creatorId: 'user-1' });
      mockSetFindByPk.mockResolvedValue(ownSet);

      const result = await deleteSet('user-1', 'set-1');

      expect(ownSet.destroy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
