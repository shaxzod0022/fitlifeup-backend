'use strict';

// ─── Mock model functions ─────────────────────────────────────────────────────

const mockCompletedSetCount = jest.fn();
const mockCompletedSetFindAll = jest.fn();
const mockCompletedProgramCount = jest.fn();
const mockCompletedProgramFindAll = jest.fn();

jest.mock('../../../src/models/index', () => ({
  CompletedSet: {
    count: (...args) => mockCompletedSetCount(...args),
    findAll: (...args) => mockCompletedSetFindAll(...args),
  },
  CompletedProgram: {
    count: (...args) => mockCompletedProgramCount(...args),
    findAll: (...args) => mockCompletedProgramFindAll(...args),
  },
}));

const { getProgressStats, getCompletionHistory } = require('../../../src/services/progress.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a mock record with a completedAt date that is `daysAgo` days before now.
 */
const recordDaysAgo = (daysAgo, extra = {}) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { completedAt: d, ...extra };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('progress.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getProgressStats ────────────────────────────────────────────────────────

  describe('getProgressStats', () => {
    it('counts workout days in the last 7 days correctly', async () => {
      // Two sets on different days within 7 days, one set on day 8 (outside window)
      // The service receives whatever findAll returns for the given `since` filter —
      // we simulate the DB already filtering by date.
      mockCompletedSetCount.mockResolvedValue(3);
      mockCompletedProgramCount.mockResolvedValue(1);

      // For the 7-day window: 2 sets on 2 distinct days, 1 program on a 3rd day → 3 unique days
      mockCompletedSetFindAll
        .mockResolvedValueOnce([
          recordDaysAgo(1), // day 1
          recordDaysAgo(3), // day 3
        ])
        .mockResolvedValueOnce([
          recordDaysAgo(1), // day 1 (same as above)
          recordDaysAgo(3), // day 3 (same as above)
        ]);

      mockCompletedProgramFindAll
        .mockResolvedValueOnce([
          recordDaysAgo(5), // day 5 — new unique day
        ])
        .mockResolvedValueOnce([
          recordDaysAgo(5),
        ]);

      const stats = await getProgressStats('user-1');

      // 3 unique days: day-1, day-3, day-5
      expect(stats.trainingDaysLast7).toBe(3);
    });

    it('counts workout days in the last 30 days correctly', async () => {
      mockCompletedSetCount.mockResolvedValue(5);
      mockCompletedProgramCount.mockResolvedValue(2);

      // For the 7-day window: 1 set on day 2
      mockCompletedSetFindAll
        .mockResolvedValueOnce([recordDaysAgo(2)])
        .mockResolvedValueOnce([
          recordDaysAgo(2),
          recordDaysAgo(10), // day 10 — within 30 days but outside 7
          recordDaysAgo(25), // day 25 — within 30 days
        ]);

      mockCompletedProgramFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          recordDaysAgo(10), // same day as set above → not a new unique day
          recordDaysAgo(20), // day 20 — new unique day
        ]);

      const stats = await getProgressStats('user-1');

      // 30-day window unique days: day-2, day-10, day-25, day-20 → 4 unique days
      expect(stats.trainingDaysLast30).toBe(4);
    });

    it('returns total counts of completed sets and programs', async () => {
      mockCompletedSetCount.mockResolvedValue(12);
      mockCompletedProgramCount.mockResolvedValue(4);

      // No activity in either window
      mockCompletedSetFindAll.mockResolvedValue([]);
      mockCompletedProgramFindAll.mockResolvedValue([]);

      const stats = await getProgressStats('user-1');

      expect(stats.totalCompletedSets).toBe(12);
      expect(stats.totalCompletedPrograms).toBe(4);
    });

    it('returns 0 training days when there is no activity', async () => {
      mockCompletedSetCount.mockResolvedValue(0);
      mockCompletedProgramCount.mockResolvedValue(0);
      mockCompletedSetFindAll.mockResolvedValue([]);
      mockCompletedProgramFindAll.mockResolvedValue([]);

      const stats = await getProgressStats('user-1');

      expect(stats.trainingDaysLast7).toBe(0);
      expect(stats.trainingDaysLast30).toBe(0);
    });

    it('counts the same day only once even when multiple records share it', async () => {
      mockCompletedSetCount.mockResolvedValue(3);
      mockCompletedProgramCount.mockResolvedValue(0);

      // Three sets all on the same day
      const sameDay = [recordDaysAgo(2), recordDaysAgo(2), recordDaysAgo(2)];

      mockCompletedSetFindAll.mockResolvedValue(sameDay);
      mockCompletedProgramFindAll.mockResolvedValue([]);

      const stats = await getProgressStats('user-1');

      expect(stats.trainingDaysLast7).toBe(1);
      expect(stats.trainingDaysLast30).toBe(1);
    });
  });

  // ── getCompletionHistory ────────────────────────────────────────────────────

  describe('getCompletionHistory', () => {
    it('returns records sorted by completedAt in descending order', async () => {
      const oldest = { id: 'cs-1', userId: 'user-1', setId: 'set-1', completedAt: new Date('2024-01-01T10:00:00Z'), durationMinutes: 30 };
      const middle = { id: 'cs-2', userId: 'user-1', setId: 'set-2', completedAt: new Date('2024-01-03T10:00:00Z'), durationMinutes: 20 };
      const newest = { id: 'cp-1', userId: 'user-1', programId: 'prog-1', completedAt: new Date('2024-01-05T10:00:00Z'), durationMinutes: 60 };

      // Sets returned in arbitrary order
      mockCompletedSetFindAll.mockResolvedValue([oldest, middle]);
      // Program is the newest
      mockCompletedProgramFindAll.mockResolvedValue([newest]);

      const history = await getCompletionHistory('user-1');

      expect(history).toHaveLength(3);
      expect(new Date(history[0].completedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(history[1].completedAt).getTime()
      );
      expect(new Date(history[1].completedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(history[2].completedAt).getTime()
      );
    });

    it('places the most recent record first', async () => {
      const early = { id: 'cs-1', userId: 'user-1', setId: 'set-1', completedAt: new Date('2024-03-01T08:00:00Z'), durationMinutes: null };
      const late  = { id: 'cp-1', userId: 'user-1', programId: 'prog-1', completedAt: new Date('2024-03-10T18:00:00Z'), durationMinutes: null };

      mockCompletedSetFindAll.mockResolvedValue([early]);
      mockCompletedProgramFindAll.mockResolvedValue([late]);

      const history = await getCompletionHistory('user-1');

      expect(history[0].id).toBe('cp-1');
      expect(history[1].id).toBe('cs-1');
    });

    it('applies pagination via limit and offset', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: `cs-${i}`,
        userId: 'user-1',
        setId: `set-${i}`,
        completedAt: new Date(2024, 0, i + 1),
        durationMinutes: null,
      }));

      mockCompletedSetFindAll.mockResolvedValue(records);
      mockCompletedProgramFindAll.mockResolvedValue([]);

      const page = await getCompletionHistory('user-1', 2, 1);

      expect(page).toHaveLength(2);
    });

    it('returns an empty array when there is no history', async () => {
      mockCompletedSetFindAll.mockResolvedValue([]);
      mockCompletedProgramFindAll.mockResolvedValue([]);

      const history = await getCompletionHistory('user-1');

      expect(history).toEqual([]);
    });

    it('tags set records with type "set" and program records with type "program"', async () => {
      const setRecord     = { id: 'cs-1', userId: 'user-1', setId: 'set-1', completedAt: new Date('2024-06-01'), durationMinutes: null };
      const programRecord = { id: 'cp-1', userId: 'user-1', programId: 'prog-1', completedAt: new Date('2024-06-02'), durationMinutes: null };

      mockCompletedSetFindAll.mockResolvedValue([setRecord]);
      mockCompletedProgramFindAll.mockResolvedValue([programRecord]);

      const history = await getCompletionHistory('user-1');

      const setEntry     = history.find((r) => r.id === 'cs-1');
      const programEntry = history.find((r) => r.id === 'cp-1');

      expect(setEntry.type).toBe('set');
      expect(programEntry.type).toBe('program');
    });
  });
});
