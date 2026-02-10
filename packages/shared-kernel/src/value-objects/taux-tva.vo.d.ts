import { ValueObject } from './value-object.base.js';
export declare class TauxTva extends ValueObject<{
    value: number;
}> {
    private constructor();
    static create(value: number): TauxTva;
    getValue(): number;
    toMultiplier(): number;
    toString(): string;
}
//# sourceMappingURL=taux-tva.vo.d.ts.map