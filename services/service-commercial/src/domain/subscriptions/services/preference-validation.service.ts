import { Injectable } from '@nestjs/common';
import {
  SubscriptionPreferenceSchemaEntity,
  PreferenceValueType,
} from '../entities/subscription-preference-schema.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PreferenceValidationService {
  validateAgainstSchema(
    values: Record<string, any>,
    schemas: SubscriptionPreferenceSchemaEntity[],
  ): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    for (const schema of schemas) {
      if (schema.isRequired && !(schema.code in values)) {
        errors.push(`Required preference '${schema.code}' is missing`);
      }
    }

    // Validate each provided value
    for (const [code, value] of Object.entries(values)) {
      const schema = schemas.find((s) => s.code === code);
      if (!schema) {
        errors.push(`Unknown preference '${code}'`);
        continue;
      }

      if (!schema.active) {
        errors.push(`Preference '${code}' is inactive`);
        continue;
      }

      // Type validation
      if (!this.validateType(value, schema.valueType)) {
        errors.push(
          `Preference '${code}' has invalid type (expected ${schema.valueType})`,
        );
        continue;
      }

      // Enum validation
      if (schema.valueType === PreferenceValueType.ENUM && schema.allowedValues) {
        if (!schema.allowedValues.includes(String(value))) {
          errors.push(
            `Preference '${code}' must be one of: ${schema.allowedValues.join(', ')}`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateType(value: any, expectedType: PreferenceValueType): boolean {
    switch (expectedType) {
      case PreferenceValueType.STRING:
        return typeof value === 'string';
      case PreferenceValueType.NUMBER:
        return typeof value === 'number';
      case PreferenceValueType.BOOLEAN:
        return typeof value === 'boolean';
      case PreferenceValueType.ENUM:
        return typeof value === 'string';
      default:
        return false;
    }
  }
}
