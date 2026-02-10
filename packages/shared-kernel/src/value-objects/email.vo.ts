import { StringValueObject, normalizeStringValue } from './value-object.base.js';
import { InvalidDataException } from '../exceptions/index.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends StringValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): Email {
    const normalized = normalizeStringValue(value, {
      fieldName: 'Email',
      maxLength: 255,
    }).toLowerCase();

    if (!EMAIL_REGEX.test(normalized)) {
      throw new InvalidDataException('Email', 'Invalid email format', { value: normalized });
    }

    return new Email(normalized);
  }
}
