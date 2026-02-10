import { StringValueObject, normalizeStringValue } from './value-object.base.js';
import { InvalidDataException } from '../exceptions/index.js';

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

export class Phone extends StringValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): Phone {
    const normalized = normalizeStringValue(value, {
      fieldName: 'Phone',
      maxLength: 20,
    });

    if (!PHONE_REGEX.test(normalized)) {
      throw new InvalidDataException('Phone', 'Invalid phone number format', { value: normalized });
    }

    return new Phone(normalized);
  }
}
