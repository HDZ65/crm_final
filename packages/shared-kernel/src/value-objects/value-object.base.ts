import { validate as uuidValidate } from 'uuid';
import { InvalidDataException } from '../exceptions/index.js';

/**
 * Base class for all Value Objects
 *
 * Value Objects are immutable objects defined by their values, not by identity.
 * Two Value Objects with the same values are considered equal.
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.props === undefined) {
      return false;
    }

    return deepEqual(this.props, vo.props);
  }
}

/**
 * Base class for string-based Value Objects
 */
export abstract class StringValueObject extends ValueObject<{ value: string }> {
  getValue(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}

/**
 * Base class for UUID-based Value Objects
 */
export abstract class UuidValueObject extends ValueObject<{ value: string }> {
  getValue(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }

  equals(other?: UuidValueObject): boolean {
    if (!other) {
      return false;
    }
    return this.props.value === other.props.value;
  }
}

export type NormalizedStringOptions = {
  fieldName: string;
  maxLength: number;
  minLength?: number;
  allowEmpty?: boolean;
};

/**
 * Helper to normalize and validate string inputs shared across VOs.
 */
export function normalizeStringValue(
  raw: string,
  { fieldName, maxLength, minLength = 1, allowEmpty = false }: NormalizedStringOptions,
): string {
  if (raw === undefined || raw === null) {
    throw new InvalidDataException(fieldName, `${fieldName} cannot be null or undefined`, {
      value: raw,
    });
  }

  const trimmed = raw.trim();

  if (!allowEmpty && trimmed.length === 0) {
    throw new InvalidDataException(fieldName, `${fieldName} cannot be empty`, {
      value: raw,
    });
  }

  if (trimmed.length < minLength) {
    throw new InvalidDataException(
      fieldName,
      `${fieldName} is too short (min ${minLength} characters)`,
      { value: raw, minLength },
    );
  }

  if (trimmed.length > maxLength) {
    throw new InvalidDataException(
      fieldName,
      `${fieldName} is too long (max ${maxLength} characters)`,
      { value: raw, maxLength },
    );
  }

  return trimmed;
}

/**
 * Helper to validate UUID format
 */
export function validateUuid(id: string, fieldName: string): void {
  const normalized = normalizeStringValue(id, {
    fieldName,
    maxLength: 36,
    minLength: 1,
  });

  if (!uuidValidate(normalized)) {
    throw new InvalidDataException(
      fieldName,
      `${fieldName} must be a valid UUID`,
      { value: normalized },
    );
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (!isObject(a) || !isObject(b)) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
  );
}
