import { ValueObject } from './value-object.base.js';
import { InvalidDataException } from '../exceptions/index.js';

interface MontantProps {
  value: number;
  currency: string;
}

/**
 * Value Object for monetary amounts
 *
 * Stores value as number (cents-safe operations delegated to caller).
 * Proto uses string for montant fields — use Montant.fromString() to parse.
 */
export class Montant extends ValueObject<MontantProps> {
  private constructor(props: MontantProps) {
    super(props);
  }

  static create(value: number, currency: string = 'EUR'): Montant {
    if (isNaN(value)) {
      throw new InvalidDataException('Montant', 'Montant must be a valid number', { value });
    }
    return new Montant({ value, currency });
  }

  static fromString(raw: string, currency: string = 'EUR'): Montant {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      throw new InvalidDataException('Montant', `Invalid montant string: "${raw}"`, { value: raw });
    }
    return new Montant({ value: parsed, currency });
  }

  static zero(currency: string = 'EUR'): Montant {
    return new Montant({ value: 0, currency });
  }

  getValue(): number {
    return this.props.value;
  }

  getCurrency(): string {
    return this.props.currency;
  }

  toString(): string {
    return this.props.value.toFixed(2);
  }

  add(other: Montant): Montant {
    this.ensureSameCurrency(other);
    return Montant.create(this.props.value + other.props.value, this.props.currency);
  }

  subtract(other: Montant): Montant {
    this.ensureSameCurrency(other);
    return Montant.create(this.props.value - other.props.value, this.props.currency);
  }

  multiply(factor: number): Montant {
    return Montant.create(this.props.value * factor, this.props.currency);
  }

  isPositive(): boolean {
    return this.props.value > 0;
  }

  isNegative(): boolean {
    return this.props.value < 0;
  }

  isZero(): boolean {
    return this.props.value === 0;
  }

  private ensureSameCurrency(other: Montant): void {
    if (this.props.currency !== other.props.currency) {
      throw new InvalidDataException(
        'Montant',
        `Cannot operate on different currencies: ${this.props.currency} vs ${other.props.currency}`,
        { currency1: this.props.currency, currency2: other.props.currency },
      );
    }
  }
}
