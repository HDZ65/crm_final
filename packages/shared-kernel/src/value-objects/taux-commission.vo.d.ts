import { ValueObject } from './value-object.base.js';
export declare class TauxCommission extends ValueObject<{
    value: number;
}> {
    private constructor();
    static create(value: number): TauxCommission;
    getValue(): number;
    toMultiplier(): number;
    toString(): string;
}
//# sourceMappingURL=taux-commission.vo.d.ts.map