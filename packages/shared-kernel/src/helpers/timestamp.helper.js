"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampHelper = void 0;
class TimestampHelper {
    static toUnixSeconds(date) {
        if (!date)
            return undefined;
        return Math.floor(date.getTime() / 1000);
    }
    static fromUnixSeconds(seconds) {
        if (seconds === undefined || seconds === null)
            return undefined;
        return new Date(seconds * 1000);
    }
    static toProtoTimestamp(date) {
        if (!date)
            return undefined;
        const ms = date.getTime();
        return {
            seconds: Math.floor(ms / 1000),
            nanos: (ms % 1000) * 1_000_000,
        };
    }
    static fromProtoTimestamp(timestamp) {
        if (!timestamp)
            return undefined;
        const ms = Number(timestamp.seconds) * 1000 +
            Math.floor(Number(timestamp.nanos) / 1_000_000);
        return new Date(ms);
    }
    static toISOString(date) {
        return date?.toISOString();
    }
    static fromISOString(isoString) {
        if (!isoString)
            return undefined;
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? undefined : date;
    }
    static nowUnix() {
        return Math.floor(Date.now() / 1000);
    }
    static nowMs() {
        return Date.now();
    }
    static normalizeTimestampToMs(timestamp) {
        const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        if (num === undefined || num === null || isNaN(num) || num <= 0) {
            return 0;
        }
        if (num < 32503680000) {
            return num * 1000;
        }
        return num;
    }
    static normalizeTimestampToSeconds(timestamp) {
        const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        if (num === undefined || num === null || isNaN(num) || num <= 0) {
            return 0;
        }
        if (num > 32503680000) {
            return Math.floor(num / 1000);
        }
        return Math.floor(num);
    }
    static nowProto() {
        const ms = Date.now();
        return {
            seconds: Math.floor(ms / 1000),
            nanos: (ms % 1000) * 1_000_000,
        };
    }
    static isPast(date) {
        if (!date)
            return false;
        return date.getTime() < Date.now();
    }
    static isFuture(date) {
        if (!date)
            return false;
        return date.getTime() > Date.now();
    }
    static truncateToHour(date = new Date()) {
        const truncated = new Date(date);
        truncated.setMinutes(0, 0, 0);
        return truncated;
    }
    static truncateToDay(date = new Date()) {
        const truncated = new Date(date);
        truncated.setHours(0, 0, 0, 0);
        return truncated;
    }
}
exports.TimestampHelper = TimestampHelper;
//# sourceMappingURL=timestamp.helper.js.map