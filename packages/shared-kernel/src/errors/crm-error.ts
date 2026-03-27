/**
 * CRM Unified Error System
 *
 * Provides a consistent error handling pattern across all microservices.
 * Compatible with gRPC, NATS, and REST transports.
 *
 * @module @crm/shared-kernel/errors
 */

/**
 * Standard CRM error codes with semantic meaning
 */
export enum CrmErrorCode {
  /** Input validation failed (e.g., missing field, invalid format) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /** Requested resource does not exist */
  NOT_FOUND = 'NOT_FOUND',

  /** Resource already exists (duplicate key, unique constraint) */
  CONFLICT = 'CONFLICT',

  /** User is not authenticated */
  UNAUTHORIZED = 'UNAUTHORIZED',

  /** User lacks permission for this action */
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  /** Business rule violation (precondition failed) */
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  /** Optimistic locking conflict */
  VERSION_CONFLICT = 'VERSION_CONFLICT',

  /** External service call failed (carrier API, payment gateway, etc.) */
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  /** Request timeout exceeded */
  TIMEOUT = 'TIMEOUT',

  /** Rate limit exceeded */
  RATE_LIMITED = 'RATE_LIMITED',

  /** Unexpected internal error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured error details for debugging and client handling
 */
export interface CrmErrorDetails {
  /** The resource type involved (e.g., "Client", "Abonnement") */
  resource?: string;

  /** The specific field that caused the error */
  field?: string;

  /** The identifier of the resource */
  identifier?: string;

  /** Expected value (for version conflicts) */
  expected?: unknown;

  /** Actual value found (for version conflicts) */
  actual?: unknown;

  /** External service name (for external errors) */
  service?: string;

  /** Additional context-specific data */
  [key: string]: unknown;
}

/**
 * Base CRM error class with structured metadata
 *
 * @example
 * ```typescript
 * // Using factory methods (recommended)
 * throw CrmError.notFound('Client', clientId);
 * throw CrmError.validation('email', 'Invalid email format');
 * throw CrmError.conflict('Abonnement', 'clientId', clientId);
 *
 * // Direct instantiation
 * throw new CrmError(
 *   CrmErrorCode.BUSINESS_RULE_VIOLATION,
 *   'Client has unpaid invoices',
 *   { clientId, unpaidAmount: 150.00 }
 * );
 * ```
 */
export class CrmError extends Error {
  public readonly timestamp: Date;

  constructor(
    public readonly code: CrmErrorCode,
    message: string,
    public readonly details: CrmErrorDetails = {},
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'CrmError';
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Preserve cause chain if available
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Resource not found
   */
  static notFound(resource: string, identifier: string | Record<string, unknown>): CrmError {
    const id = typeof identifier === 'string' ? identifier : JSON.stringify(identifier);
    return new CrmError(CrmErrorCode.NOT_FOUND, `${resource} '${id}' not found`, {
      resource,
      identifier: id,
    });
  }

  /**
   * Validation error on a specific field
   */
  static validation(field: string, message: string, details?: CrmErrorDetails): CrmError {
    return new CrmError(CrmErrorCode.VALIDATION_ERROR, `Validation error on '${field}': ${message}`, {
      field,
      ...details,
    });
  }

  /**
   * Multiple validation errors
   */
  static validationMultiple(errors: Array<{ field: string; message: string }>): CrmError {
    const message = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    return new CrmError(CrmErrorCode.VALIDATION_ERROR, `Validation errors: ${message}`, {
      errors,
    });
  }

  /**
   * Resource conflict (duplicate, unique constraint violation)
   */
  static conflict(resource: string, field: string, value: unknown): CrmError {
    return new CrmError(
      CrmErrorCode.CONFLICT,
      `${resource} with ${field} '${String(value)}' already exists`,
      { resource, field, value },
    );
  }

  /**
   * Optimistic locking version conflict
   */
  static versionConflict(
    resource: string,
    identifier: string,
    expected: number,
    actual: number,
  ): CrmError {
    return new CrmError(
      CrmErrorCode.VERSION_CONFLICT,
      `Version conflict for ${resource} '${identifier}': expected v${expected}, found v${actual}`,
      { resource, identifier, expected, actual },
    );
  }

  /**
   * User not authenticated
   */
  static unauthorized(message = 'Authentication required'): CrmError {
    return new CrmError(CrmErrorCode.UNAUTHORIZED, message);
  }

  /**
   * User lacks permission
   */
  static permissionDenied(action: string, resource: string, reason?: string): CrmError {
    const msg = reason
      ? `Permission denied: cannot ${action} ${resource} - ${reason}`
      : `Permission denied: cannot ${action} ${resource}`;
    return new CrmError(CrmErrorCode.PERMISSION_DENIED, msg, { action, resource, reason });
  }

  /**
   * Business rule violation
   */
  static businessRule(rule: string, reason: string, details?: CrmErrorDetails): CrmError {
    return new CrmError(
      CrmErrorCode.BUSINESS_RULE_VIOLATION,
      `Business rule '${rule}' violated: ${reason}`,
      { rule, reason, ...details },
    );
  }

  /**
   * External service error
   */
  static externalService(service: string, message: string, cause?: Error): CrmError {
    return new CrmError(
      CrmErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service '${service}' error: ${message}`,
      { service },
      cause,
    );
  }

  /**
   * Timeout error
   */
  static timeout(operation: string, timeoutMs: number): CrmError {
    return new CrmError(CrmErrorCode.TIMEOUT, `Operation '${operation}' timed out after ${timeoutMs}ms`, {
      operation,
      timeoutMs,
    });
  }

  /**
   * Rate limit exceeded
   */
  static rateLimited(resource: string, retryAfterMs?: number): CrmError {
    return new CrmError(CrmErrorCode.RATE_LIMITED, `Rate limit exceeded for ${resource}`, {
      resource,
      retryAfterMs,
    });
  }

  /**
   * Internal error (wraps unexpected errors)
   */
  static internal(message: string, cause?: Error): CrmError {
    return new CrmError(CrmErrorCode.INTERNAL_ERROR, message, {}, cause);
  }

  /**
   * Wrap any error into a CrmError
   */
  static wrap(error: unknown, defaultCode = CrmErrorCode.INTERNAL_ERROR): CrmError {
    if (error instanceof CrmError) {
      return error;
    }

    if (error instanceof Error) {
      return new CrmError(defaultCode, error.message, {}, error);
    }

    return new CrmError(defaultCode, String(error));
  }

  /**
   * Check if an error is a specific CrmError code
   */
  static is(error: unknown, code: CrmErrorCode): error is CrmError {
    return error instanceof CrmError && error.code === code;
  }

  /**
   * Serializable representation for logging/transport
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      cause: this.cause?.message,
    };
  }
}

/**
 * Result type for operations that can fail
 * Provides type-safe error handling without try/catch
 */
export type CrmResult<T> =
  | { success: true; data: T }
  | { success: false; error: CrmError };

/**
 * Helper to create a successful result
 */
export function ok<T>(data: T): CrmResult<T> {
  return { success: true, data };
}

/**
 * Helper to create a failed result
 */
export function err<T>(error: CrmError): CrmResult<T> {
  return { success: false, error };
}

/**
 * Execute an async operation and wrap result
 */
export async function tryCrmResult<T>(fn: () => Promise<T>): Promise<CrmResult<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(CrmError.wrap(error));
  }
}
