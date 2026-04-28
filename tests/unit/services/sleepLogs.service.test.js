'use strict';

const { ValidationError, ForbiddenError } = require('../../../src/utils/errors');

// ─── Mock model factories ─────────────────────────────────────────────────────

const mockSleepLog = (overrides = {}) => ({
  id: 'sleep-log-1',
  userId: 'user-1',
  sleepAt: new Date('2024-01-15T22:00:00Z'),
  wakeAt: new Date('2024-01-16T06:00:00Z'),
  qualityScore: 4,
  awakenings: 1,
  update: jest.fn(),
  destroy: jest.fn(),
  ...overrides,
});

// ─── Mock model methods ───────────────────────────────────────────────────────

const mockSleepLogCreate = jest.fn();
const mockSleepLogFindByPk = jest.fn();
const mockSleepLogFindAll = jest.fn();

jest.mock('../../../src/models/index', () => ({
  SleepLog: {
    create: (...args) => mockSleepLogCreate(...args),
    findByPk: (...args) => mockSleepLogFindByPk(...args),
    findAll: (...args) => mockSleepLogFindAll(...args),
  },
}));

const {
  createSleepLog,
  updateSleepLog,
  deleteSleepLog,
  getSleepStats,
} = require('../../../src/services/sleepLogs.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('sleepLogs.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createSleepLog ──────────────────────────────────────────────────────────

  describe('createSleepLog', () => {
    /**
     * Validates: Requirements 7.3
     * createSleepLog must throw ValidationError (400) when wakeAt is before sleepAt.
     */
    it('throws ValidationError (400) when wakeAt is before sleepAt', async () => {
      const err = await createSleepLog('user-1', {
        sleepAt: '2024-01-16T06:00:00Z',
        wakeAt: '2024-01-15T22:00:00Z', // earlier than sleepAt
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    /**
     * Validates: Requirements 7.3
     * createSleepLog must throw ValidationError (400) when wakeAt equals sleepAt.
     */
    it('throws ValidationError (400) when wakeAt equals sleepAt', async () => {
      const err = await createSleepLog('user-1', {
        sleepAt: '2024-01-15T22:00:00Z',
        wakeAt: '2024-01-15T22:00:00Z',
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    /**
     * Validates: Requirements 7.4
     * createSleepLog must throw ValidationError (400) when qualityScore is below 1.
     */
    it('throws ValidationError (400) when qualityScore is below 1', async () => {
      const err = await createSleepLog('user-1', {
        sleepAt: '2024-01-15T22:00:00Z',
        wakeAt: '2024-01-16T06:00:00Z',
        qualityScore: 0,
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    /**
     * Validates: Requirements 7.4
     * createSleepLog must throw ValidationError (400) when qualityScore is above 5.
     */
    it('throws ValidationError (400) when qualityScore is above 5', async () => {
      const err = await createSleepLog('user-1', {
        sleepAt: '2024-01-15T22:00:00Z',
        wakeAt: '2024-01-16T06:00:00Z',
        qualityScore: 6,
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    it('creates and returns a SleepLog when data is valid', async () => {
      const created = mockSleepLog();
      mockSleepLogCreate.mockResolvedValue(created);

      const result = await createSleepLog('user-1', {
        sleepAt: '2024-01-15T22:00:00Z',
        wakeAt: '2024-01-16T06:00:00Z',
        qualityScore: 4,
        awakenings: 1,
      });

      expect(mockSleepLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' })
      );
      expect(result).toBe(created);
    });

    it('accepts a null qualityScore without throwing', async () => {
      const created = mockSleepLog({ qualityScore: null });
      mockSleepLogCreate.mockResolvedValue(created);

      await expect(
        createSleepLog('user-1', {
          sleepAt: '2024-01-15T22:00:00Z',
          wakeAt: '2024-01-16T06:00:00Z',
          qualityScore: null,
        })
      ).resolves.toBe(created);
    });
  });

  // ── updateSleepLog ──────────────────────────────────────────────────────────

  describe('updateSleepLog', () => {
    /**
     * Validates: Requirements 7.7
     * updateSleepLog must throw ForbiddenError (403) when the record belongs to another user.
     */
    it('throws ForbiddenError (403) when the record belongs to another user', async () => {
      mockSleepLogFindByPk.mockResolvedValue(mockSleepLog({ userId: 'other-user' }));

      const err = await updateSleepLog('user-1', 'sleep-log-1', {
        qualityScore: 3,
      }).catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('updates and returns the record when the owner calls it', async () => {
      const log = mockSleepLog();
      log.update.mockResolvedValue(log);
      mockSleepLogFindByPk.mockResolvedValue(log);

      const result = await updateSleepLog('user-1', 'sleep-log-1', { qualityScore: 5 });

      expect(log.update).toHaveBeenCalledWith({ qualityScore: 5 });
      expect(result).toBe(log);
    });
  });

  // ── deleteSleepLog ──────────────────────────────────────────────────────────

  describe('deleteSleepLog', () => {
    /**
     * Validates: Requirements 7.7
     * deleteSleepLog must throw ForbiddenError (403) when the record belongs to another user.
     */
    it('throws ForbiddenError (403) when the record belongs to another user', async () => {
      mockSleepLogFindByPk.mockResolvedValue(mockSleepLog({ userId: 'other-user' }));

      const err = await deleteSleepLog('user-1', 'sleep-log-1').catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.statusCode).toBe(403);
    });

    it('deletes the record when the owner calls it', async () => {
      const log = mockSleepLog();
      log.destroy.mockResolvedValue();
      mockSleepLogFindByPk.mockResolvedValue(log);

      await deleteSleepLog('user-1', 'sleep-log-1');

      expect(log.destroy).toHaveBeenCalled();
    });
  });

  // ── getSleepStats ───────────────────────────────────────────────────────────

  describe('getSleepStats', () => {
    /**
     * Validates: Requirements 7.9
     * getSleepStats must correctly calculate average duration, average quality score,
     * and average awakenings across all SleepLogs in the given period.
     */
    it('correctly calculates average duration, quality score, and awakenings', async () => {
      // Log 1: 8 hours sleep, quality 4, 1 awakening
      // Log 2: 6 hours sleep, quality 2, 3 awakenings
      const logs = [
        mockSleepLog({
          sleepAt: new Date('2024-01-15T22:00:00Z'),
          wakeAt: new Date('2024-01-16T06:00:00Z'), // 8 hours
          qualityScore: 4,
          awakenings: 1,
        }),
        mockSleepLog({
          id: 'sleep-log-2',
          sleepAt: new Date('2024-01-16T23:00:00Z'),
          wakeAt: new Date('2024-01-17T05:00:00Z'), // 6 hours
          qualityScore: 2,
          awakenings: 3,
        }),
      ];

      mockSleepLogFindAll.mockResolvedValue(logs);

      const result = await getSleepStats('user-1', '2024-01-15', '2024-01-17');

      expect(result.avgDurationHours).toBeCloseTo(7, 5); // (8 + 6) / 2 = 7
      expect(result.avgQualityScore).toBeCloseTo(3, 5);  // (4 + 2) / 2 = 3
      expect(result.avgAwakenings).toBeCloseTo(2, 5);    // (1 + 3) / 2 = 2
    });

    it('returns nulls when there are no sleep logs in the period', async () => {
      mockSleepLogFindAll.mockResolvedValue([]);

      const result = await getSleepStats('user-1', '2024-01-15', '2024-01-17');

      expect(result).toEqual({
        avgDurationHours: null,
        avgQualityScore: null,
        avgAwakenings: null,
      });
    });

    it('ignores null qualityScore and awakenings when computing averages', async () => {
      const logs = [
        mockSleepLog({
          sleepAt: new Date('2024-01-15T22:00:00Z'),
          wakeAt: new Date('2024-01-16T06:00:00Z'), // 8 hours
          qualityScore: null,
          awakenings: null,
        }),
      ];

      mockSleepLogFindAll.mockResolvedValue(logs);

      const result = await getSleepStats('user-1', '2024-01-15', '2024-01-16');

      expect(result.avgDurationHours).toBeCloseTo(8, 5);
      expect(result.avgQualityScore).toBeNull();
      expect(result.avgAwakenings).toBeNull();
    });
  });
});
