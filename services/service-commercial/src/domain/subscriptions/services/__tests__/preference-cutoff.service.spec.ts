import { beforeEach, describe, expect, test } from 'bun:test';
import {
  PreferenceCutoffService,
  CutoffConfig,
  CycleInfo,
} from '../preference-cutoff.service';

// ─── Helpers ──────────────────────────────────────────────────────────

/** A standard Friday-17h-Paris cutoff used by most tests. */
const FRIDAY_17H_PARIS: CutoffConfig = {
  dayOfWeek: 5, // Friday
  hour: 17,
  timezone: 'Europe/Paris',
};

/** A weekly cycle starting on a Monday. */
function weekCycle(mondayIso: string): CycleInfo {
  const start = new Date(mondayIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { cycleStart: start, cycleEnd: end };
}

/** Monthly cycle helper. */
function monthlyCycle(startIso: string, endIso: string): CycleInfo {
  return { cycleStart: new Date(startIso), cycleEnd: new Date(endIso) };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('PreferenceCutoffService', () => {
  let service: PreferenceCutoffService;

  beforeEach(() => {
    service = new PreferenceCutoffService();
  });

  // ────────────────────────────────────────────────────────────────────
  // determineCycleForChange
  // ────────────────────────────────────────────────────────────────────
  describe('determineCycleForChange', () => {
    test('change on Monday morning (well before Friday 17h) → current cycle', () => {
      // Cycle: Mon 2024-01-01 → Sun 2024-01-07
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Change: Monday 09:00 UTC (= 10:00 Paris in winter)
      const change = new Date('2024-01-01T09:00:00Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('current');
    });

    test('change on Friday morning (before 17h Paris) → current cycle', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Friday 2024-01-05 10:00 UTC = 11:00 Paris → before 17h
      const change = new Date('2024-01-05T10:00:00Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('current');
    });

    test('change on Friday evening (after 17h Paris) → next cycle', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Friday 2024-01-05 18:00 UTC = 19:00 Paris → after 17h
      const change = new Date('2024-01-05T18:00:00Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('next');
    });

    test('change exactly at cutoff moment → next cycle (>= boundary)', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Friday 2024-01-05 at 16:00 UTC = 17:00 Paris (CET = UTC+1 in winter)
      const change = new Date('2024-01-05T16:00:00Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('next');
    });

    test('change one millisecond before cutoff → current cycle', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // 1ms before Friday 16:00 UTC (= 17:00 Paris)
      const change = new Date('2024-01-05T15:59:59.999Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('current');
    });

    test('change on Saturday (after cutoff day) → next cycle', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      const change = new Date('2024-01-06T10:00:00Z'); // Saturday

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('next');
    });

    test('change on Sunday (after cutoff day) → next cycle', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      const change = new Date('2024-01-07T10:00:00Z'); // Sunday

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('next');
    });

    test('handles Wednesday cutoff correctly', () => {
      const wednesdayCutoff: CutoffConfig = {
        dayOfWeek: 3, // Wednesday
        hour: 12,
        timezone: 'Europe/Paris',
      };
      const cycle = weekCycle('2024-01-01T00:00:00Z');

      // Tuesday 2024-01-02 → before Wednesday cutoff → current
      const changeBefore = new Date('2024-01-02T10:00:00Z');
      expect(service.determineCycleForChange(changeBefore, wednesdayCutoff, cycle)).toBe('current');

      // Thursday 2024-01-04 → after Wednesday cutoff → next
      const changeAfter = new Date('2024-01-04T10:00:00Z');
      expect(service.determineCycleForChange(changeAfter, wednesdayCutoff, cycle)).toBe('next');
    });

    test('handles monthly cycle with Friday cutoff', () => {
      const cycle = monthlyCycle('2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z');
      // First Friday of cycle: Jan 5. After 17h → next.
      const change = new Date('2024-01-05T18:00:00Z');

      expect(service.determineCycleForChange(change, FRIDAY_17H_PARIS, cycle)).toBe('next');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getCutoffTimestamp
  // ────────────────────────────────────────────────────────────────────
  describe('getCutoffTimestamp', () => {
    test('returns a Friday for a cycle starting on Monday', () => {
      // Mon 2024-01-01 00:00 UTC
      const cycleStart = new Date('2024-01-01T00:00:00Z');
      const cutoff = service.getCutoffTimestamp(FRIDAY_17H_PARIS, cycleStart);

      // Cutoff should be Friday 2024-01-05 at 17:00 Paris = 16:00 UTC
      expect(cutoff.getUTCDay()).toBe(5); // Friday
      expect(cutoff.getUTCHours()).toBe(16); // 17h Paris = 16h UTC in winter (CET)
    });

    test('returns same day when cycle starts on cutoff day but before cutoff hour', () => {
      // If cycle starts on Friday, cutoff is that same Friday
      const cycleStart = new Date('2024-01-05T06:00:00Z'); // Friday 07:00 Paris
      const cutoff = service.getCutoffTimestamp(FRIDAY_17H_PARIS, cycleStart);

      // Should still be 2024-01-05 at 16:00 UTC
      expect(cutoff.getUTCFullYear()).toBe(2024);
      expect(cutoff.getUTCMonth()).toBe(0); // January
      expect(cutoff.getUTCDate()).toBe(5);
      expect(cutoff.getUTCHours()).toBe(16);
    });

    test('handles UTC timezone with no offset', () => {
      const utcConfig: CutoffConfig = { dayOfWeek: 3, hour: 14, timezone: 'UTC' };
      const cycleStart = new Date('2024-01-01T00:00:00Z'); // Monday

      const cutoff = service.getCutoffTimestamp(utcConfig, cycleStart);

      // Wednesday 14:00 UTC
      expect(cutoff.getUTCDay()).toBe(3);
      expect(cutoff.getUTCHours()).toBe(14);
    });

    test('handles summer time (CEST = UTC+2)', () => {
      // July: Europe/Paris is CEST (UTC+2)
      const cycle = new Date('2024-07-01T00:00:00Z'); // Monday
      const cutoff = service.getCutoffTimestamp(FRIDAY_17H_PARIS, cycle);

      // Friday 17:00 Paris in summer = 15:00 UTC
      expect(cutoff.getUTCDay()).toBe(5);
      expect(cutoff.getUTCHours()).toBe(15);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getAppliesFromCycleNumber
  // ────────────────────────────────────────────────────────────────────
  describe('getAppliesFromCycleNumber', () => {
    test('returns current cycle number when change is before cutoff', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Tuesday morning → well before Friday 17h
      const change = new Date('2024-01-02T09:00:00Z');

      const result = service.getAppliesFromCycleNumber(change, FRIDAY_17H_PARIS, cycle, 3);
      expect(result).toBe(3);
    });

    test('returns next cycle number when change is after cutoff', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      // Saturday → after Friday 17h
      const change = new Date('2024-01-06T09:00:00Z');

      const result = service.getAppliesFromCycleNumber(change, FRIDAY_17H_PARIS, cycle, 3);
      expect(result).toBe(4);
    });

    test('returns cycle 1 for first cycle before cutoff', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      const change = new Date('2024-01-01T08:00:00Z');

      const result = service.getAppliesFromCycleNumber(change, FRIDAY_17H_PARIS, cycle, 1);
      expect(result).toBe(1);
    });

    test('returns cycle 2 for first cycle after cutoff', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      const change = new Date('2024-01-06T08:00:00Z');

      const result = service.getAppliesFromCycleNumber(change, FRIDAY_17H_PARIS, cycle, 1);
      expect(result).toBe(2);
    });

    test('handles high cycle numbers', () => {
      const cycle = weekCycle('2024-01-01T00:00:00Z');
      const change = new Date('2024-01-06T20:00:00Z'); // Saturday evening → next

      const result = service.getAppliesFromCycleNumber(change, FRIDAY_17H_PARIS, cycle, 52);
      expect(result).toBe(53);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Edge cases & timezone handling
  // ────────────────────────────────────────────────────────────────────
  describe('timezone edge cases', () => {
    test('Asia/Tokyo cutoff (UTC+9) works correctly', () => {
      const tokyoConfig: CutoffConfig = {
        dayOfWeek: 4, // Thursday
        hour: 18,
        timezone: 'Asia/Tokyo',
      };
      const cycle = weekCycle('2024-01-01T00:00:00Z');

      // Thursday 18:00 Tokyo = 09:00 UTC → change at 08:00 UTC should be before cutoff
      const changeBefore = new Date('2024-01-04T08:00:00Z');
      expect(service.determineCycleForChange(changeBefore, tokyoConfig, cycle)).toBe('current');

      // Thursday 18:00 Tokyo = 09:00 UTC → change at 10:00 UTC should be after cutoff
      const changeAfter = new Date('2024-01-04T10:00:00Z');
      expect(service.determineCycleForChange(changeAfter, tokyoConfig, cycle)).toBe('next');
    });

    test('America/New_York cutoff (UTC-5 winter) works correctly', () => {
      const nyConfig: CutoffConfig = {
        dayOfWeek: 5, // Friday
        hour: 17,
        timezone: 'America/New_York',
      };
      const cycle = weekCycle('2024-01-01T00:00:00Z');

      // Friday 17:00 EST = 22:00 UTC → change at 21:00 UTC → before cutoff
      const changeBefore = new Date('2024-01-05T21:00:00Z');
      expect(service.determineCycleForChange(changeBefore, nyConfig, cycle)).toBe('current');

      // Friday 17:00 EST = 22:00 UTC → change at 23:00 UTC → after cutoff
      const changeAfter = new Date('2024-01-05T23:00:00Z');
      expect(service.determineCycleForChange(changeAfter, nyConfig, cycle)).toBe('next');
    });

    test('cutoff on Sunday with cycle starting Monday', () => {
      const sundayCutoff: CutoffConfig = {
        dayOfWeek: 0, // Sunday
        hour: 23,
        timezone: 'Europe/Paris',
      };
      const cycle = weekCycle('2024-01-01T00:00:00Z'); // Mon

      // Sunday 2024-01-07 at 20:00 UTC = 21:00 Paris → before 23:00 cutoff
      const changeBefore = new Date('2024-01-07T20:00:00Z');
      expect(service.determineCycleForChange(changeBefore, sundayCutoff, cycle)).toBe('current');
    });

    test('cutoff on same day as cycle start', () => {
      const mondayCutoff: CutoffConfig = {
        dayOfWeek: 1, // Monday
        hour: 8,
        timezone: 'UTC',
      };
      const cycle = weekCycle('2024-01-01T00:00:00Z'); // Monday

      // Monday 07:00 UTC → before 08:00 → current
      const changeBefore = new Date('2024-01-01T07:00:00Z');
      expect(service.determineCycleForChange(changeBefore, mondayCutoff, cycle)).toBe('current');

      // Monday 09:00 UTC → after 08:00 → next
      const changeAfter = new Date('2024-01-01T09:00:00Z');
      expect(service.determineCycleForChange(changeAfter, mondayCutoff, cycle)).toBe('next');
    });
  });
});
