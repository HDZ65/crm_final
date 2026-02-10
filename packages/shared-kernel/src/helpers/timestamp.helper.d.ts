export interface ProtoTimestamp {
    seconds: number;
    nanos: number;
}
export declare class TimestampHelper {
    static toUnixSeconds(date?: Date | null): number | undefined;
    static fromUnixSeconds(seconds?: number | null): Date | undefined;
    static toProtoTimestamp(date?: Date | null): ProtoTimestamp | undefined;
    static fromProtoTimestamp(timestamp?: ProtoTimestamp | null): Date | undefined;
    static toISOString(date?: Date | null): string | undefined;
    static fromISOString(isoString?: string | null): Date | undefined;
    static nowUnix(): number;
    static nowMs(): number;
    static normalizeTimestampToMs(timestamp?: number | string | null): number;
    static normalizeTimestampToSeconds(timestamp?: number | string | null): number;
    static nowProto(): ProtoTimestamp;
    static isPast(date?: Date | null): boolean;
    static isFuture(date?: Date | null): boolean;
    static truncateToHour(date?: Date): Date;
    static truncateToDay(date?: Date): Date;
}
//# sourceMappingURL=timestamp.helper.d.ts.map