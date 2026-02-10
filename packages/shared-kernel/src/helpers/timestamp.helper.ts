/**
 * Timestamp Helper
 *
 * Utilities for converting between Date objects and various timestamp formats.
 *
 * @module @crm/shared-kernel/helpers
 */

/**
 * Protobuf Timestamp type (google.protobuf.Timestamp)
 */
export interface ProtoTimestamp {
  seconds: number;
  nanos: number;
}

/**
 * Timestamp conversion utilities
 */
export class TimestampHelper {
  static toUnixSeconds(date?: Date | null): number | undefined {
    if (!date) return undefined;
    return Math.floor(date.getTime() / 1000);
  }

  static fromUnixSeconds(seconds?: number | null): Date | undefined {
    if (seconds === undefined || seconds === null) return undefined;
    return new Date(seconds * 1000);
  }

  static toProtoTimestamp(date?: Date | null): ProtoTimestamp | undefined {
    if (!date) return undefined;
    const ms = date.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      nanos: (ms % 1000) * 1_000_000,
    };
  }

  static fromProtoTimestamp(timestamp?: ProtoTimestamp | null): Date | undefined {
    if (!timestamp) return undefined;
    const ms =
      Number(timestamp.seconds) * 1000 +
      Math.floor(Number(timestamp.nanos) / 1_000_000);
    return new Date(ms);
  }

  static toISOString(date?: Date | null): string | undefined {
    return date?.toISOString();
  }

  static fromISOString(isoString?: string | null): Date | undefined {
    if (!isoString) return undefined;
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? undefined : date;
  }

  static nowUnix(): number {
    return Math.floor(Date.now() / 1000);
  }

  static nowMs(): number {
    return Date.now();
  }

  static normalizeTimestampToMs(timestamp?: number | string | null): number {
    const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (num === undefined || num === null || isNaN(num) || num <= 0) {
      return 0;
    }

    if (num < 32503680000) {
      return num * 1000;
    }

    return num;
  }

  static normalizeTimestampToSeconds(timestamp?: number | string | null): number {
    const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (num === undefined || num === null || isNaN(num) || num <= 0) {
      return 0;
    }

    if (num > 32503680000) {
      return Math.floor(num / 1000);
    }

    return Math.floor(num);
  }

  static nowProto(): ProtoTimestamp {
    const ms = Date.now();
    return {
      seconds: Math.floor(ms / 1000),
      nanos: (ms % 1000) * 1_000_000,
    };
  }

  static isPast(date?: Date | null): boolean {
    if (!date) return false;
    return date.getTime() < Date.now();
  }

  static isFuture(date?: Date | null): boolean {
    if (!date) return false;
    return date.getTime() > Date.now();
  }

  static truncateToHour(date: Date = new Date()): Date {
    const truncated = new Date(date);
    truncated.setMinutes(0, 0, 0);
    return truncated;
  }

  static truncateToDay(date: Date = new Date()): Date {
    const truncated = new Date(date);
    truncated.setHours(0, 0, 0, 0);
    return truncated;
  }
}
