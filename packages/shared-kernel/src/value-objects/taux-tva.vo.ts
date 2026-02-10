import { ValueObject } from './value-object.base.js';
import { InvalidDataException } from '../exceptions/index.js';

/**
 * Value Object for TVA rates (0-100%)
 */
export class TauxTva extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  static create(value: number): TauxTva {
    if (isNaN(value) || value < 0 || value > 100) {
      throw new InvalidDataException(
        'TauxTva',
        'TVA rate must be between 0 and 100',
        { value },
      );
    }
    return new TauxTva(value);
  }

  getValue(): number {
    return this.props.value;
  }

  toMultiplier(): number {
    return 1 + this.props.value / 100;
  }

  toString(): string {
    return `${this.props.value}%`;
  }
}
