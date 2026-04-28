'use strict';

/**
 * Unit tests for calculateTotalTime
 * Validates: Requirements 2.2
 *
 * Formula: sum((exercise.time × count × repeats) + (count × break × repeats))
 * Note: `break` is in seconds and is converted to minutes (÷ 60) inside the function.
 */

const { calculateTotalTime } = require('../../../src/services/sets.service');

describe('calculateTotalTime', () => {
  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('returns 0 for an empty array', () => {
    expect(calculateTotalTime([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(calculateTotalTime(null)).toBe(0);
    expect(calculateTotalTime(undefined)).toBe(0);
  });

  it('returns 0 when all values are zero', () => {
    const items = [
      { exercise: { time: 0 }, count: 0, break: 0, repeats: 0 },
    ];
    expect(calculateTotalTime(items)).toBe(0);
  });

  // ── Single item ─────────────────────────────────────────────────────────────

  it('calculates correct time for a single item with all non-zero values', () => {
    // exercise.time = 5 min, count = 3, break = 60 sec (= 1 min), repeats = 2
    // itemTime = (5 × 3 × 2) + (3 × 1 × 2) = 30 + 6 = 36 min
    const items = [
      { exercise: { time: 5 }, count: 3, break: 60, repeats: 2 },
    ];
    expect(calculateTotalTime(items)).toBe(36);
  });

  it('calculates correct time for a single repeat and single count', () => {
    // exercise.time = 10 min, count = 1, break = 120 sec (= 2 min), repeats = 1
    // itemTime = (10 × 1 × 1) + (1 × 2 × 1) = 10 + 2 = 12 min
    const items = [
      { exercise: { time: 10 }, count: 1, break: 120, repeats: 1 },
    ];
    expect(calculateTotalTime(items)).toBe(12);
  });

  it('only break time contributes when exercise.time is 0', () => {
    // exercise.time = 0, count = 4, break = 30 sec (= 0.5 min), repeats = 3
    // itemTime = (0 × 4 × 3) + (4 × 0.5 × 3) = 0 + 6 = 6 min
    const items = [
      { exercise: { time: 0 }, count: 4, break: 30, repeats: 3 },
    ];
    expect(calculateTotalTime(items)).toBe(6);
  });

  // ── Multiple items ──────────────────────────────────────────────────────────

  it('sums time correctly for multiple items', () => {
    // Item 1: exercise.time = 5, count = 2, break = 60 sec (= 1 min), repeats = 3
    //   → (5 × 2 × 3) + (2 × 1 × 3) = 30 + 6 = 36 min
    // Item 2: exercise.time = 8, count = 1, break = 120 sec (= 2 min), repeats = 2
    //   → (8 × 1 × 2) + (1 × 2 × 2) = 16 + 4 = 20 min
    // Total = 36 + 20 = 56 min
    const items = [
      { exercise: { time: 5 }, count: 2, break: 60, repeats: 3 },
      { exercise: { time: 8 }, count: 1, break: 120, repeats: 2 },
    ];
    expect(calculateTotalTime(items)).toBe(56);
  });

  it('handles items with missing exercise gracefully (treats time as 0)', () => {
    // No exercise object — only break contributes
    // count = 2, break = 60 sec (= 1 min), repeats = 3
    // itemTime = (0 × 2 × 3) + (2 × 1 × 3) = 0 + 6 = 6 min
    const items = [
      { exercise: null, count: 2, break: 60, repeats: 3 },
    ];
    expect(calculateTotalTime(items)).toBe(6);
  });
});
