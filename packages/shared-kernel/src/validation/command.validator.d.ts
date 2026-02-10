export declare class CommandValidator {
    static requireField<T>(value: T | undefined | null, fieldName: string, entityName?: string): asserts value is T;
    static requireOneOf(fields: Record<string, unknown>, entityName?: string): void;
    static ensureUnique<T>(findFn: () => Promise<T | null>, fieldName: string, value: string, entityName?: string): Promise<void>;
    static validateLength(value: string | undefined | null, fieldName: string, options: {
        min?: number;
        max?: number;
    }, entityName?: string): void;
    static validateRange(value: number | undefined | null, fieldName: string, options: {
        min?: number;
        max?: number;
    }, entityName?: string): void;
    static validateEnum<T extends string>(value: T | undefined | null, fieldName: string, allowedValues: readonly T[], entityName?: string): void;
}
//# sourceMappingURL=command.validator.d.ts.map