export declare abstract class ValueObject<T> {
    protected readonly props: T;
    protected constructor(props: T);
    equals(vo?: ValueObject<T>): boolean;
}
export declare abstract class StringValueObject extends ValueObject<{
    value: string;
}> {
    getValue(): string;
    toString(): string;
}
export declare abstract class UuidValueObject extends ValueObject<{
    value: string;
}> {
    getValue(): string;
    toString(): string;
    equals(other?: UuidValueObject): boolean;
}
export type NormalizedStringOptions = {
    fieldName: string;
    maxLength: number;
    minLength?: number;
    allowEmpty?: boolean;
};
export declare function normalizeStringValue(raw: string, { fieldName, maxLength, minLength, allowEmpty }: NormalizedStringOptions): string;
export declare function validateUuid(id: string, fieldName: string): void;
//# sourceMappingURL=value-object.base.d.ts.map