import { PipeTransform, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  uuid?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: readonly (string | number)[];
  pattern?: RegExp;
}

function validateValue(value: unknown, rule: ValidationRule): string | null {
  const fieldName = rule.field;

  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      return `${fieldName} must be of type ${rule.type}`;
    }
  }

  if (rule.uuid && typeof value === 'string' && !UUID_REGEX.test(value)) {
    return `${fieldName} must be a valid UUID`;
  }

  if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
    return `${fieldName} must be at least ${rule.minLength} characters`;
  }

  if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
    return `${fieldName} must be at most ${rule.maxLength} characters`;
  }

  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    return `${fieldName} must be at least ${rule.min}`;
  }

  if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
    return `${fieldName} must be at most ${rule.max}`;
  }

  if (rule.enum && !rule.enum.includes(value as string | number)) {
    return `${fieldName} must be one of: ${rule.enum.join(', ')}`;
  }

  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return `${fieldName} has invalid format`;
  }

  return null;
}

export function validate(data: Record<string, unknown>, rules: ValidationRule[]): void {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const error = validateValue(value, rule);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: errors.join('; '),
    });
  }
}

export const RetryPolicyValidation: ValidationRule[] = [
  { field: 'organisation_id', required: true, type: 'string', uuid: true },
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'retry_delays_days', required: true, type: 'array' },
  { field: 'max_attempts', required: true, type: 'number', min: 1, max: 10 },
  { field: 'max_total_days', required: true, type: 'number', min: 1, max: 365 },
];

export const PaymentRejectedValidation: ValidationRule[] = [
  { field: 'event_id', required: true, type: 'string' },
  { field: 'organisation_id', required: true, type: 'string', uuid: true },
  { field: 'societe_id', required: true, type: 'string', uuid: true },
  { field: 'payment_id', required: true, type: 'string', uuid: true },
  { field: 'schedule_id', required: true, type: 'string', uuid: true },
  { field: 'client_id', required: true, type: 'string', uuid: true },
  { field: 'reason_code', required: true, type: 'string', minLength: 1 },
  { field: 'amount_cents', required: true, type: 'number', min: 1 },
  { field: 'currency', required: true, type: 'string', pattern: /^[A-Z]{3}$/ },
  { field: 'psp_name', required: true, type: 'string', minLength: 1 },
  { field: 'idempotency_key', required: true, type: 'string', minLength: 1 },
];

export const RunNowValidation: ValidationRule[] = [
  { field: 'organisation_id', required: true, type: 'string', uuid: true },
  { field: 'triggered_by', required: true, type: 'string', minLength: 1 },
];

export const CancelRetryScheduleValidation: ValidationRule[] = [
  { field: 'id', required: true, type: 'string', uuid: true },
  { field: 'reason', required: true, type: 'string', minLength: 1, maxLength: 500 },
  { field: 'cancelled_by', required: true, type: 'string', minLength: 1 },
];

@Injectable()
export class GrpcValidationPipe implements PipeTransform {
  private readonly logger = new Logger(GrpcValidationPipe.name);

  transform(value: Record<string, unknown>): Record<string, unknown> {
    return value;
  }
}
