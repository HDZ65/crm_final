/**
 * Command Validation Helpers
 *
 * Common validation patterns for command handlers.
 *
 * @module @crm/shared-kernel/validation
 */

import {
  InvalidDataException,
  AlreadyExistsException,
} from '../exceptions/domain.exception.js';

/**
 * Command validation helpers
 */
export class CommandValidator {
  static requireField<T>(
    value: T | undefined | null,
    fieldName: string,
    entityName: string = 'Entity',
  ): asserts value is T {
    if (value === undefined || value === null || value === '') {
      throw new InvalidDataException(
        entityName,
        `${fieldName} is required`,
        { field: fieldName },
      );
    }
  }

  static requireOneOf(
    fields: Record<string, unknown>,
    entityName: string = 'Entity',
  ): void {
    const hasValue = Object.entries(fields).some(
      ([_, value]) => value !== undefined && value !== null && value !== '',
    );

    if (!hasValue) {
      const fieldNames = Object.keys(fields).join(' or ');
      throw new InvalidDataException(
        entityName,
        `At least one of ${fieldNames} is required`,
        { fields: Object.keys(fields) },
      );
    }
  }

  static async ensureUnique<T>(
    findFn: () => Promise<T | null>,
    fieldName: string,
    value: string,
    entityName: string = 'Entity',
  ): Promise<void> {
    const existing = await findFn();
    if (existing) {
      throw new AlreadyExistsException(entityName, value, { field: fieldName });
    }
  }

  static validateLength(
    value: string | undefined | null,
    fieldName: string,
    options: { min?: number; max?: number },
    entityName: string = 'Entity',
  ): void {
    if (!value) return;

    if (options.min !== undefined && value.length < options.min) {
      throw new InvalidDataException(
        entityName,
        `${fieldName} must be at least ${options.min} characters`,
        { field: fieldName, minLength: options.min, actualLength: value.length },
      );
    }

    if (options.max !== undefined && value.length > options.max) {
      throw new InvalidDataException(
        entityName,
        `${fieldName} must be at most ${options.max} characters`,
        { field: fieldName, maxLength: options.max, actualLength: value.length },
      );
    }
  }

  static validateRange(
    value: number | undefined | null,
    fieldName: string,
    options: { min?: number; max?: number },
    entityName: string = 'Entity',
  ): void {
    if (value === undefined || value === null) return;

    if (options.min !== undefined && value < options.min) {
      throw new InvalidDataException(
        entityName,
        `${fieldName} must be at least ${options.min}`,
        { field: fieldName, minValue: options.min, actualValue: value },
      );
    }

    if (options.max !== undefined && value > options.max) {
      throw new InvalidDataException(
        entityName,
        `${fieldName} must be at most ${options.max}`,
        { field: fieldName, maxValue: options.max, actualValue: value },
      );
    }
  }

  static validateEnum<T extends string>(
    value: T | undefined | null,
    fieldName: string,
    allowedValues: readonly T[],
    entityName: string = 'Entity',
  ): void {
    if (!value) return;

    if (!allowedValues.includes(value)) {
      throw new InvalidDataException(
        entityName,
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        { field: fieldName, allowedValues, actualValue: value },
      );
    }
  }
}
