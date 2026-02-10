import { ValueObject } from './value-object.base.js';
import { InvalidDataException } from '../exceptions/index.js';

/**
 * Value Object for commission rates (0-100%)
 */
export class TauxCommission extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  static create(value: number): TauxCommission {
    if (isNaN(value) || value < 0 || value > 100) {
      throw new InvalidDataException(
        'TauxCommission',
        'Commission rate must be between 0 and 100',
        { value },
      );
    }
    return new TauxCommission(value);
  }

  getValue(): number {
    return this.props.value;
  }

  toMultiplier(): number {
    return this.props.value / 100;
  }

  toString(): string {
    return `${this.props.value}%`;
  }
}
