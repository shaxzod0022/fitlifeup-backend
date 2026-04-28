'use strict';

const { Op } = require('sequelize');
const { NotFoundError, ForbiddenError } = require('../../../src/utils/errors');

// ─── Mock Dish model ──────────────────────────────────────────────────────────

const mockDish = (overrides = {}) => ({
  id: 'dish-1',
  name: 'Oatmeal',
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
  Dish: {
    create: (...args) => mockCreate(...args),
    findAll: (...args) => mockFindAll(...args),
    findByPk: (...args) => mockFindByPk(...args),
  },
}));

const {
  createDish,
  listDishes,
  getDishById,
  updateDish,
  deleteDish,
} = require('../../../src/services/dishes.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('dishes.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createDish ──────────────────────────────────────────────────────────────

  describe('createDish', () => {
    /**
     * Validates: Requirements 5.2
     * createDish must set creatorId to the userId parameter
     */
    it('saves dish with creatorId set to userId and returns it', async () => {
      const created = mockDish({ creatorId: 'user-1' });
      mockCreate.mockResolvedValue(created);

      const result = await createDish('user-1', { name: 'Oatmeal' });

      expect(mockCreate).toHaveBeenCalledWith({ name: 'Oatmeal', creatorId: 'user-1' });
      expect(result).toBe(created);
      expect(result.creatorId).toBe('user-1');
    });
  });

  // ── listDishes ──────────────────────────────────────────────────────────────

  describe('listDishes', () => {
    it('queries public dishes OR own dishes', async () => {
      const list = [mockDish({ visibility: 'public', creatorId: 'admin' })];
      mockFindAll.mockResolvedValue(list);

      const result = await listDishes('user-1');

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

  // ── getDishById ─────────────────────────────────────────────────────────────

  describe('getDishById', () => {
    it('returns dish when it belongs to the user', async () => {
      const dish = mockDish({ creatorId: 'user-1', visibility: 'private' });
      mockFindByPk.mockResolvedValue(dish);

      const result = await getDishById('user-1', 'dish-1');
      expect(result).toBe(dish);
    });

    it('returns public dish belonging to another user', async () => {
      const dish = mockDish({ creatorId: 'admin', visibility: 'public' });
      mockFindByPk.mockResolvedValue(dish);

      const result = await getDishById('user-1', 'dish-1');
      expect(result).toBe(dish);
    });

    it('throws NotFoundError when dish does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(getDishById('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError (403) for private dish of another user', async () => {
      const dish = mockDish({ creatorId: 'other-user', visibility: 'private' });
      mockFindByPk.mockResolvedValue(dish);

      const err = await getDishById('user-1', 'dish-1').catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });

  // ── updateDish ──────────────────────────────────────────────────────────────

  describe('updateDish', () => {
    /**
     * Validates: Requirements 5.5
     * updateDish must succeed when the dish belongs to the requesting user
     */
    it('updates and returns dish when user is the owner', async () => {
      const dish = mockDish({ creatorId: 'user-1' });
      mockFindByPk.mockResolvedValue(dish);

      const result = await updateDish('user-1', 'dish-1', { name: 'Granola' });

      expect(dish.update).toHaveBeenCalledWith({ name: 'Granola' });
      expect(result).toBe(dish);
    });

    it('throws NotFoundError when dish does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(updateDish('user-1', 'missing', {})).rejects.toThrow(NotFoundError);
    });

    /**
     * Validates: Requirements 5.5
     * updateDish must throw ForbiddenError (403) when the dish belongs to another user
     */
    it('throws ForbiddenError (403) when user is not the owner', async () => {
      const dish = mockDish({ creatorId: 'other-user' });
      mockFindByPk.mockResolvedValue(dish);

      const err = await updateDish('user-1', 'dish-1', {}).catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });

  // ── deleteDish ──────────────────────────────────────────────────────────────

  describe('deleteDish', () => {
    /**
     * Validates: Requirements 5.5
     * deleteDish must succeed when the dish belongs to the requesting user
     */
    it('deletes dish when user is the owner and returns nothing', async () => {
      const dish = mockDish({ creatorId: 'user-1' });
      mockFindByPk.mockResolvedValue(dish);

      const result = await deleteDish('user-1', 'dish-1');

      expect(dish.destroy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('throws NotFoundError when dish does not exist', async () => {
      mockFindByPk.mockResolvedValue(null);

      await expect(deleteDish('user-1', 'missing')).rejects.toThrow(NotFoundError);
    });

    /**
     * Validates: Requirements 5.5
     * deleteDish must throw ForbiddenError (403) when the dish belongs to another user
     */
    it('throws ForbiddenError (403) when user is not the owner', async () => {
      const dish = mockDish({ creatorId: 'other-user' });
      mockFindByPk.mockResolvedValue(dish);

      const err = await deleteDish('user-1', 'dish-1').catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });
  });
});
