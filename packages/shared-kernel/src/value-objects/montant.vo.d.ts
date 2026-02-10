import { ValueObject } from './value-object.base.js';
interface MontantProps {
    value: number;
    currency: string;
}
export declare class Montant extends ValueObject<MontantProps> {
    private constructor();
    static create(value: number, currency?: string): Montant;
    static fromString(raw: string, currency?: string): Montant;
    static zero(currency?: string): Montant;
    getValue(): number;
    getCurrency(): string;
    toString(): string;
    add(other: Montant): Montant;
    subtract(other: Montant): Montant;
    multiply(factor: number): Montant;
    isPositive(): boolean;
    isNegative(): boolean;
    isZero(): boolean;
    private ensureSameCurrency;
}
export {};
//# sourceMappingURL=montant.vo.d.ts.map