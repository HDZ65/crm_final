import { Injectable } from '@nestjs/common';

export interface CutoffConfig {
  /** 0=Sunday, 1=Monday, …, 6=Saturday */
  dayOfWeek: number;
  /** Hour of day in target timezone (0-23) */
  hour: number;
  /** IANA timezone, e.g. 'Europe/Paris' */
  timezone: string;
}

export interface CycleInfo {
  cycleStart: Date;
  cycleEnd: Date;
}

@Injectable()
export class PreferenceCutoffService {
  /**
   * Determines if a preference change applies to the current or next cycle.
   *
   * Logic:
   * - Calculate cut-off timestamp for current cycle
   * - If changeTimestamp < cutoffTimestamp → applies to current cycle
   * - If changeTimestamp >= cutoffTimestamp → applies to next cycle
   */
  determineCycleForChange(
    changeTimestamp: Date,
    cutoffConfig: CutoffConfig,
    currentCycle: CycleInfo,
  ): 'current' | 'next' {
    const cutoffTimestamp = this.getCutoffTimestamp(cutoffConfig, currentCycle.cycleStart);

    return changeTimestamp < cutoffTimestamp ? 'current' : 'next';
  }

  /**
   * Calculates the exact cut-off moment for a cycle.
   *
   * The cut-off is defined as the first occurrence of dayOfWeek/hour
   * on or after cycleStart, expressed in the configured timezone.
   *
   * Uses Intl.DateTimeFormat for reliable timezone conversion
   * instead of the unreliable toLocaleString round-trip.
   */
  getCutoffTimestamp(cutoffConfig: CutoffConfig, cycleStart: Date): Date {
    // Step 1 – Decompose cycleStart into parts in the target timezone
    const parts = this.getDatePartsInTimezone(cycleStart, cutoffConfig.timezone);

    // Step 2 – Compute the number of days from cycleStart's weekday to the cutoff weekday
    const daysUntilCutoff = (cutoffConfig.dayOfWeek - parts.weekday + 7) % 7;

    // Step 3 – Build a new Date in the target timezone using the decomposed parts
    //   shifted by daysUntilCutoff and forced to cutoffConfig.hour
    const cutoffYear = parts.year;
    const cutoffMonth = parts.month; // 1-based
    const cutoffDay = parts.day + daysUntilCutoff;

    // Build an ISO-like string and let Date.UTC do the heavy lifting
    // We create the date at the desired wall-clock time in UTC first,
    // then adjust for the timezone offset.
    const naive = new Date(
      Date.UTC(cutoffYear, cutoffMonth - 1, cutoffDay, cutoffConfig.hour, 0, 0, 0),
    );

    // Step 4 – Correct for the timezone offset at the cut-off moment
    const offsetMs = this.getTimezoneOffsetMs(naive, cutoffConfig.timezone);
    return new Date(naive.getTime() - offsetMs);
  }

  /**
   * Returns the cycle number a preference change applies to.
   * Either currentCycleNumber (before cut-off) or currentCycleNumber + 1 (after).
   */
  getAppliesFromCycleNumber(
    changeTimestamp: Date,
    cutoffConfig: CutoffConfig,
    currentCycle: CycleInfo,
    currentCycleNumber: number,
  ): number {
    const appliesTo = this.determineCycleForChange(changeTimestamp, cutoffConfig, currentCycle);
    return appliesTo === 'current' ? currentCycleNumber : currentCycleNumber + 1;
  }

  // ─── Private helpers ────────────────────────────────────────────────

  /**
   * Decomposes a UTC Date into { year, month (1-based), day, weekday, hour }
   * as observed in the given IANA timezone.
   */
  private getDatePartsInTimezone(
    date: Date,
    timezone: string,
  ): { year: number; month: number; day: number; weekday: number; hour: number } {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(date);

    const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return {
      year: Number(get('year')),
      month: Number(get('month')),
      day: Number(get('day')),
      weekday: weekdayMap[get('weekday')] ?? 0,
      hour: Number(get('hour')),
    };
  }

  /**
   * Returns the offset in milliseconds between the target timezone and UTC
   * for a given instant. Positive means timezone is ahead of UTC.
   *
   * Example: Europe/Paris in winter = UTC+1 → returns +3_600_000
   */
  private getTimezoneOffsetMs(date: Date, timezone: string): number {
    // Format the date in both UTC and target timezone and compute difference
    const utcParts = this.getDatePartsInTimezone(date, 'UTC');
    const tzParts = this.getDatePartsInTimezone(date, timezone);

    // Build comparable day + hour values
    const utcTotal = utcParts.day * 24 + utcParts.hour;
    const tzTotal = tzParts.day * 24 + tzParts.hour;

    return (tzTotal - utcTotal) * 3_600_000;
  }
}
