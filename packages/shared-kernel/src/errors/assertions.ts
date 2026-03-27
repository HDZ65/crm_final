/**
 * Assertion Helpers for gRPC Controllers
 *
 * Type-safe assertion functions that throw appropriate gRPC exceptions.
 * Eliminates repetitive null checks and manual exception throwing.
 *
 * @module @crm/shared-kernel/errors
 */

import {
  GrpcBusinessRuleException,
  GrpcConflictException,
  GrpcNotFoundException,
  GrpcPermissionDeniedException,
  GrpcValidationException,
} from './grpc-exceptions.js';

/**
 * Assert that an entity exists, throw GrpcNotFoundException if null/undefined
 *
 * @example
 * ```typescript
 * const client = await this.clientService.findById(id);
 * assertFound(client, 'Client', id);
 * // client is now narrowed to non-null type
 * return client;
 * ```
 */
export function assertFound<T>(
  entity: T | null | undefined,
  resource: string,
  identifier: string | Record<string, unknown>,
  correlationId?: string,
): asserts entity is T {
  if (entity === null || entity === undefined) {
    throw new GrpcNotFoundException(resource, identifier, correlationId);
  }
}

/**
 * Assert that a condition is true, throw GrpcValidationException if false
 *
 * @example
 * ```typescript
 * assertValid(email.includes('@'), 'email', 'Invalid email format');
 * assertValid(amount > 0, 'amount', 'Must be positive');
 * ```
 */
export function assertValid(
  condition: boolean,
  field: string,
  message: string,
  correlationId?: string,
): asserts condition {
  if (!condition) {
    throw new GrpcValidationException(field, message, undefined, correlationId);
  }
}

/**
 * Assert that a value is defined (not null/undefined), throw GrpcValidationException if not
 *
 * @example
 * ```typescript
 * assertDefined(request.clientId, 'clientId', 'Client ID is required');
 * // clientId is now narrowed to non-null type
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  field: string,
  message = `${field} is required`,
  correlationId?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new GrpcValidationException(field, message, undefined, correlationId);
  }
}

/**
 * Assert that a string is not empty, throw GrpcValidationException if empty
 *
 * @example
 * ```typescript
 * assertNotEmpty(request.name, 'name');
 * ```
 */
export function assertNotEmpty(
  value: string | null | undefined,
  field: string,
  message = `${field} cannot be empty`,
  correlationId?: string,
): asserts value is string {
  if (!value || value.trim() === '') {
    throw new GrpcValidationException(field, message, undefined, correlationId);
  }
}

/**
 * Assert user has permission, throw GrpcPermissionDeniedException if false
 *
 * @example
 * ```typescript
 * assertPermission(user.canDelete, 'delete', 'Client');
 * assertPermission(user.role === 'ADMIN', 'update', 'Settings', 'Admin role required');
 * ```
 */
export function assertPermission(
  condition: boolean,
  action: string,
  resource: string,
  reason?: string,
  correlationId?: string,
): asserts condition {
  if (!condition) {
    throw new GrpcPermissionDeniedException(action, resource, reason, correlationId);
  }
}

/**
 * Assert a business rule is satisfied, throw GrpcBusinessRuleException if false
 *
 * @example
 * ```typescript
 * assertBusinessRule(
 *   client.statut === 'ACTIF',
 *   'client_active',
 *   'Client must be active to create expedition'
 * );
 * ```
 */
export function assertBusinessRule(
  condition: boolean,
  rule: string,
  reason: string,
  details?: Record<string, unknown>,
  correlationId?: string,
): asserts condition {
  if (!condition) {
    throw new GrpcBusinessRuleException(rule, reason, details, correlationId);
  }
}

/**
 * Assert no conflict exists, throw GrpcConflictException if duplicate found
 *
 * @example
 * ```typescript
 * const existing = await this.service.findByEmail(email);
 * assertNoConflict(existing === null, 'Client', 'email', email);
 * ```
 */
export function assertNoConflict(
  condition: boolean,
  resource: string,
  field: string,
  value: unknown,
  correlationId?: string,
): asserts condition {
  if (!condition) {
    throw new GrpcConflictException(resource, field, value, correlationId);
  }
}

/**
 * Assert array is not empty, throw GrpcValidationException if empty
 *
 * @example
 * ```typescript
 * assertArrayNotEmpty(request.items, 'items', 'At least one item is required');
 * ```
 */
export function assertArrayNotEmpty<T>(
  array: T[] | null | undefined,
  field: string,
  message = `${field} cannot be empty`,
  correlationId?: string,
): asserts array is T[] {
  if (!array || array.length === 0) {
    throw new GrpcValidationException(field, message, undefined, correlationId);
  }
}

/**
 * Assert value is in allowed set, throw GrpcValidationException if not
 *
 * @example
 * ```typescript
 * assertOneOf(status, ['ACTIF', 'PAUSE', 'SUSPENDU'], 'status');
 * ```
 */
export function assertOneOf<T>(
  value: T,
  allowedValues: readonly T[],
  field: string,
  correlationId?: string,
): void {
  if (!allowedValues.includes(value)) {
    throw new GrpcValidationException(
      field,
      `Must be one of: ${allowedValues.join(', ')}`,
      { value, allowedValues },
      correlationId,
    );
  }
}

/**
 * Assert numeric value is within range, throw GrpcValidationException if out of range
 *
 * @example
 * ```typescript
 * assertInRange(quantity, 1, 1000, 'quantity');
 * assertInRange(percentage, 0, 100, 'percentage');
 * ```
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  field: string,
  correlationId?: string,
): void {
  if (value < min || value > max) {
    throw new GrpcValidationException(
      field,
      `Must be between ${min} and ${max}`,
      { value, min, max },
      correlationId,
    );
  }
}

/**
 * Assert value matches regex pattern, throw GrpcValidationException if not
 *
 * @example
 * ```typescript
 * assertMatches(email, /^[\w.-]+@[\w.-]+\.\w+$/, 'email', 'Invalid email format');
 * ```
 */
export function assertMatches(
  value: string,
  pattern: RegExp,
  field: string,
  message = `${field} has invalid format`,
  correlationId?: string,
): void {
  if (!pattern.test(value)) {
    throw new GrpcValidationException(field, message, { pattern: pattern.source }, correlationId);
  }
}

/**
 * Assert UUID format, throw GrpcValidationException if invalid
 *
 * @example
 * ```typescript
 * assertUuid(clientId, 'clientId');
 * ```
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(
  value: string | null | undefined,
  field: string,
  correlationId?: string,
): asserts value is string {
  if (!value || !UUID_REGEX.test(value)) {
    throw new GrpcValidationException(field, 'Must be a valid UUID', undefined, correlationId);
  }
}

/**
 * Assert date is in the future, throw GrpcValidationException if not
 *
 * @example
 * ```typescript
 * assertFutureDate(expirationDate, 'expirationDate');
 * ```
 */
export function assertFutureDate(
  date: Date | string | null | undefined,
  field: string,
  correlationId?: string,
): void {
  if (!date) {
    throw new GrpcValidationException(field, `${field} is required`, undefined, correlationId);
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    throw new GrpcValidationException(field, 'Invalid date format', undefined, correlationId);
  }

  if (dateObj <= new Date()) {
    throw new GrpcValidationException(field, 'Must be a future date', undefined, correlationId);
  }
}

/**
 * Assert date is in the past, throw GrpcValidationException if not
 *
 * @example
 * ```typescript
 * assertPastDate(birthDate, 'birthDate');
 * ```
 */
export function assertPastDate(
  date: Date | string | null | undefined,
  field: string,
  correlationId?: string,
): void {
  if (!date) {
    throw new GrpcValidationException(field, `${field} is required`, undefined, correlationId);
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    throw new GrpcValidationException(field, 'Invalid date format', undefined, correlationId);
  }

  if (dateObj >= new Date()) {
    throw new GrpcValidationException(field, 'Must be a past date', undefined, correlationId);
  }
}
