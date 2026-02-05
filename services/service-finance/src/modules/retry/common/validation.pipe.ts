import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

/**
 * Validation rules interface
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validate data against a schema
 */
export function validate(data: Record<string, unknown>, schema: ValidationSchema): void {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }
      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      }
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} must be an array`);
      }

      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
      }

      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: errors.join(', '),
    });
  }
}

// Retry Policy Validation Schema
export const RetryPolicyValidation: ValidationSchema = {
  organisation_id: { required: true, type: 'string' },
  name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  retry_delays_days: { required: true, type: 'array' },
  max_attempts: { required: true, type: 'number', min: 1 },
  max_total_days: { required: true, type: 'number', min: 1 },
  retry_on_am04: { required: true, type: 'boolean' },
  stop_on_payment_settled: { required: true, type: 'boolean' },
  stop_on_contract_cancelled: { required: true, type: 'boolean' },
  stop_on_mandate_revoked: { required: true, type: 'boolean' },
};

// Cancel Retry Schedule Validation Schema
export const CancelRetryScheduleValidation: ValidationSchema = {
  retry_schedule_id: { required: true, type: 'string' },
  cancelled_by_user_id: { required: true, type: 'string' },
  reason: { type: 'string', maxLength: 500 },
};

// Payment Rejected Validation Schema
export const PaymentRejectedValidation: ValidationSchema = {
  organisation_id: { required: true, type: 'string' },
  societe_id: { required: true, type: 'string' },
  payment_intent_id: { required: true, type: 'string' },
  rejection_code: { required: true, type: 'string' },
};

// Run Now Validation Schema
export const RunNowValidation: ValidationSchema = {
  retry_schedule_id: { required: true, type: 'string' },
  triggered_by_user_id: { required: true, type: 'string' },
};
