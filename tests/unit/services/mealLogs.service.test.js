'use strict';

const { NotFoundError, ConflictError } = require('../../../src/utils/errors');

// ─── Mock model factories ─────────────────────────────────────────────────────

const mockMealLog = (overrides = {}) => ({
  id: 'meal-log-1',
  userId: 'user-1',
  date: '2024-01-15',
  mealType: 'breakfast',
  entries: [],
  ...overrides,
});

const mockMealEntry = (overrides = {}) => ({
  id: 'entry-1',
  mealLogId: 'meal-log-1',
  dishId: 'dish-1',
  useSnapshot: false,
  snapshot: null,
  portionGrams: null,
  ...overrides,
});

const mockDish = (overrides = {}) => ({
  id: 'dish-1',
  name: 'Oatmeal',
  protein: 5,
  carbohydrate: 30,
  fat: 3,
  description: 'Healthy breakfast',
  image: null,
  ...overrides,
});

// ─── Mock model methods ───────────────────────────────────────────────────────

const mockMealLogFindOne = jest.fn();
const mockMealLogCreate = jest.fn();
const mockMealLogFindByPk = jest.fn();
const mockMealLogFindAll = jest.fn();

const mockMealEntryCreate = jest.fn();

const mockDishFindByPk = jest.fn();

jest.mock('../../../src/models/index', () => ({
  MealLog: {
    findOne: (...args) => mockMealLogFindOne(...args),
    create: (...args) => mockMealLogCreate(...args),
    findByPk: (...args) => mockMealLogFindByPk(...args),
    findAll: (...args) => mockMealLogFindAll(...args),
  },
  MealEntry: {
    create: (...args) => mockMealEntryCreate(...args),
  },
  Dish: {
    findByPk: (...args) => mockDishFindByPk(...args),
  },
}));

const {
  createMealLog,
  addMealEntry,
  getNutritionSummary,
} = require('../../../src/services/mealLogs.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mealLogs.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createMealLog ───────────────────────────────────────────────────────────

  describe('createMealLog', () => {
    /**
     * Validates: Requirements 6.8
     * createMealLog must throw ConflictError (409) when a MealLog with the same
     * (userId, date, mealType) combination already exists.
     */
    it('throws ConflictError (409) when a duplicate (userId, date, mealType) exists', async () => {
      mockMealLogFindOne.mockResolvedValue(mockMealLog());

      const err = await createMealLog('user-1', {
        date: '2024-01-15',
        mealType: 'breakfast',
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ConflictError);
      expect(err.statusCode).toBe(409);
    });

    it('creates and returns a MealLog when no duplicate exists', async () => {
      mockMealLogFindOne.mockResolvedValue(null);
      const created = mockMealLog();
      mockMealLogCreate.mockResolvedValue(created);

      const result = await createMealLog('user-1', {
        date: '2024-01-15',
        mealType: 'breakfast',
      });

      expect(mockMealLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', date: '2024-01-15', mealType: 'breakfast' })
      );
      expect(result).toBe(created);
    });
  });

  // ── addMealEntry ────────────────────────────────────────────────────────────

  describe('addMealEntry', () => {
    /**
     * Validates: Requirements 6.4, 6.5
     * addMealEntry with useSnapshot = true must copy dish data into the snapshot field.
     */
    it('populates snapshot with dish data when useSnapshot = true', async () => {
      const log = mockMealLog();
      const dish = mockDish();
      const entry = mockMealEntry({
        useSnapshot: true,
        snapshot: {
          name: dish.name,
          protein: dish.protein,
          carbohydrate: dish.carbohydrate,
          fat: dish.fat,
          description: dish.description,
          image: dish.image,
        },
      });

      mockMealLogFindByPk.mockResolvedValue(log);
      mockDishFindByPk.mockResolvedValue(dish);
      mockMealEntryCreate.mockResolvedValue(entry);

      const result = await addMealEntry('meal-log-1', {
        dishId: 'dish-1',
        useSnapshot: true,
        portionGrams: 200,
      });

      // Verify MealEntry.create was called with a populated snapshot
      expect(mockMealEntryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshot: expect.objectContaining({
            name: 'Oatmeal',
            protein: 5,
            carbohydrate: 30,
            fat: 3,
          }),
        })
      );
      expect(result.snapshot).not.toBeNull();
      expect(result.snapshot.name).toBe('Oatmeal');
    });

    /**
     * Validates: Requirements 6.4, 6.5
     * addMealEntry with useSnapshot = false must store only dishId; snapshot must be null.
     */
    it('stores only dishId and leaves snapshot null when useSnapshot = false', async () => {
      const log = mockMealLog();
      const entry = mockMealEntry({ dishId: 'dish-1', useSnapshot: false, snapshot: null });

      mockMealLogFindByPk.mockResolvedValue(log);
      mockMealEntryCreate.mockResolvedValue(entry);

      const result = await addMealEntry('meal-log-1', {
        dishId: 'dish-1',
        useSnapshot: false,
        portionGrams: 150,
      });

      // Dish.findByPk should NOT be called when useSnapshot is false
      expect(mockDishFindByPk).not.toHaveBeenCalled();

      // MealEntry.create should be called with snapshot = null
      expect(mockMealEntryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          dishId: 'dish-1',
          snapshot: null,
        })
      );
      expect(result.snapshot).toBeNull();
    });

    it('throws NotFoundError when the MealLog does not exist', async () => {
      mockMealLogFindByPk.mockResolvedValue(null);

      await expect(
        addMealEntry('missing-log', { dishId: 'dish-1', useSnapshot: false })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when useSnapshot = true but dish does not exist', async () => {
      mockMealLogFindByPk.mockResolvedValue(mockMealLog());
      mockDishFindByPk.mockResolvedValue(null);

      await expect(
        addMealEntry('meal-log-1', { dishId: 'missing-dish', useSnapshot: true })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── getNutritionSummary ─────────────────────────────────────────────────────

  describe('getNutritionSummary', () => {
    /**
     * Validates: Requirements 6.9
     * getNutritionSummary must correctly sum protein, carbohydrate, and fat
     * across all MealEntries for the given day.
     */
    it('correctly sums macronutrients across all MealEntries for the day', async () => {
      // Two meal logs with entries using dish data (useSnapshot = false)
      const logs = [
        mockMealLog({
          id: 'log-1',
          mealType: 'breakfast',
          entries: [
            mockMealEntry({
              useSnapshot: false,
              snapshot: null,
              dish: mockDish({ protein: 10, carbohydrate: 40, fat: 5 }),
            }),
          ],
        }),
        mockMealLog({
          id: 'log-2',
          mealType: 'lunch',
          entries: [
            mockMealEntry({
              useSnapshot: false,
              snapshot: null,
              dish: mockDish({ protein: 20, carbohydrate: 60, fat: 10 }),
            }),
          ],
        }),
      ];

      mockMealLogFindAll.mockResolvedValue(logs);

      const result = await getNutritionSummary('user-1', '2024-01-15');

      expect(result.protein).toBe(30);       // 10 + 20
      expect(result.carbohydrate).toBe(100); // 40 + 60
      expect(result.fat).toBe(15);           // 5 + 10
    });

    it('uses snapshot data instead of dish data when useSnapshot = true', async () => {
      const logs = [
        mockMealLog({
          entries: [
            mockMealEntry({
              useSnapshot: true,
              snapshot: { protein: 15, carbohydrate: 50, fat: 8 },
              dish: mockDish({ protein: 999, carbohydrate: 999, fat: 999 }), // should be ignored
            }),
          ],
        }),
      ];

      mockMealLogFindAll.mockResolvedValue(logs);

      const result = await getNutritionSummary('user-1', '2024-01-15');

      // Snapshot values should be used, not dish values
      expect(result.protein).toBe(15);
      expect(result.carbohydrate).toBe(50);
      expect(result.fat).toBe(8);
    });

    it('returns zeros when there are no meal logs for the day', async () => {
      mockMealLogFindAll.mockResolvedValue([]);

      const result = await getNutritionSummary('user-1', '2024-01-15');

      expect(result).toEqual({ protein: 0, carbohydrate: 0, fat: 0 });
    });

    it('skips entries with no dish and no snapshot', async () => {
      const logs = [
        mockMealLog({
          entries: [
            mockMealEntry({ useSnapshot: false, snapshot: null, dish: null }),
          ],
        }),
      ];

      mockMealLogFindAll.mockResolvedValue(logs);

      const result = await getNutritionSummary('user-1', '2024-01-15');

      expect(result).toEqual({ protein: 0, carbohydrate: 0, fat: 0 });
    });
  });
});
