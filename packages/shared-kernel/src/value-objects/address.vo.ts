import { ValueObject } from './value-object.base.js';

interface AddressProps {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  complement?: string;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  static create(props: AddressProps): Address {
    return new Address({
      street: props.street?.trim() || '',
      city: props.city?.trim() || '',
      postalCode: props.postalCode?.trim() || '',
      country: props.country?.trim() || '',
      complement: props.complement?.trim(),
    });
  }

  getStreet(): string { return this.props.street; }
  getCity(): string { return this.props.city; }
  getPostalCode(): string { return this.props.postalCode; }
  getCountry(): string { return this.props.country; }
  getComplement(): string | undefined { return this.props.complement; }

  toString(): string {
    const parts = [this.props.street];
    if (this.props.complement) parts.push(this.props.complement);
    parts.push(`${this.props.postalCode} ${this.props.city}`);
    parts.push(this.props.country);
    return parts.join(', ');
  }

  toPrimitives(): AddressProps {
    return { ...this.props };
  }
}
