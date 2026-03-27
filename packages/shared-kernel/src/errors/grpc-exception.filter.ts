/**
 * Enhanced gRPC Exception Filter
 *
 * Unified exception handling for gRPC controllers with:
 * - CrmError and GrpcException support
 * - TypeORM error mapping (EntityNotFoundError, QueryFailedError)
 * - Legacy DomainException support (backward compatibility)
 * - Structured JSON logging
 * - Internal error sanitization (no stack traces to clients)
 *
 * @module @crm/shared-kernel/errors
 */

import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, BadRequestException, Catch, Logger, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

import { CrmError, CrmErrorCode } from './crm-error.js';
import {
  CRM_TO_GRPC_STATUS,
  GrpcException,
  GrpcInternalException,
  GRPC_STATUS_NAMES,
  toGrpcException,
} from './grpc-exceptions.js';

// Legacy exceptions (backward compatibility)
import {
  AlreadyExistsException,
  BusinessRuleException,
  DomainException,
  InvalidDataException,
  NotFoundException,
  UnauthorizedException,
  VersionConflictException,
} from '../exceptions/index';

/**
 * TypeORM error types (dynamically checked to avoid hard dependency)
 */
const TYPEORM_ERROR_NAMES = {
  EntityNotFoundError: 'EntityNotFoundError',
  QueryFailedError: 'QueryFailedError',
  OptimisticLockVersionMismatchError: 'OptimisticLockVersionMismatchError',
  CannotCreateEntityIdMapError: 'CannotCreateEntityIdMapError',
} as const;

/**
 * PostgreSQL error codes for constraint violations
 */
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',
} as const;

interface GrpcErrorResponse {
  code: number;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Enhanced gRPC Exception Filter
 *
 * Register globally in your NestJS app:
 * ```typescript
 * app.useGlobalFilters(new EnhancedGrpcExceptionFilter());
 * ```
 *
 * Or per-controller:
 * ```typescript
 * @UseFilters(EnhancedGrpcExceptionFilter)
 * @Controller()
 * export class MyController { ... }
 * ```
 */
@Catch()
export class EnhancedGrpcExceptionFilter implements RpcExceptionFilter<Error> {
  private readonly logger = new Logger(EnhancedGrpcExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): Observable<never> {
    const ctx = host.switchToRpc();
    const data = ctx.getData();
    const correlationId = this.extractCorrelationId(data);

    // Convert to GrpcException and get response
    const grpcException = this.toGrpcException(exception, correlationId);
    const errorResponse = this.buildErrorResponse(grpcException);

    // Structured logging
    this.logException(exception, grpcException, correlationId, data);

    // Return RpcException for NestJS gRPC transport
    const rpcException = new RpcException(errorResponse) as RpcException & {
      code?: number;
      details?: unknown;
    };
    rpcException.code = errorResponse.code;
    rpcException.details = errorResponse.details;

    return throwError(() => rpcException);
  }

  /**
   * Convert any exception to a GrpcException
   */
  private toGrpcException(exception: Error, correlationId?: string): GrpcException {
    // Already a GrpcException
    if (exception instanceof GrpcException) {
      return exception;
    }

    // CrmError
    if (exception instanceof CrmError) {
      return toGrpcException(exception, correlationId);
    }

    // Existing RpcException (preserve status)
    if (exception instanceof RpcException) {
      return this.handleRpcException(exception, correlationId);
    }

    // Legacy DomainException types (backward compatibility)
    if (exception instanceof DomainException) {
      return this.handleLegacyDomainException(exception, correlationId);
    }

    // NestJS BadRequestException
    if (exception instanceof BadRequestException) {
      return this.handleBadRequestException(exception, correlationId);
    }

    // TypeORM errors
    const typeormResult = this.handleTypeOrmException(exception, correlationId);
    if (typeormResult) {
      return typeormResult;
    }

    // Unknown/internal error - sanitize message
    return new GrpcInternalException(
      this.sanitizeErrorMessage(exception),
      exception,
      correlationId,
    );
  }

  /**
   * Handle existing RpcException
   */
  private handleRpcException(exception: RpcException, correlationId?: string): GrpcException {
    const error = exception.getError();

    if (typeof error === 'object' && error !== null) {
      const errObj = error as { code?: number; message?: string };
      const code = errObj.code ?? GrpcStatus.UNKNOWN;
      const message = errObj.message ?? 'Unknown RPC error';

      // Map gRPC code back to CrmErrorCode
      const crmCode = this.grpcStatusToCrmCode(code);
      const crmError = new CrmError(crmCode, message);
      return toGrpcException(crmError, correlationId);
    }

    return new GrpcInternalException(String(error), exception, correlationId);
  }

  /**
   * Handle legacy DomainException types
   */
  private handleLegacyDomainException(exception: DomainException, correlationId?: string): GrpcException {
    const crmError = this.domainExceptionToCrmError(exception);
    return toGrpcException(crmError, correlationId);
  }

  /**
   * Convert legacy DomainException to CrmError
   */
  private domainExceptionToCrmError(exception: DomainException): CrmError {
    if (exception instanceof NotFoundException) {
      return CrmError.notFound(
        exception.metadata?.entityName ?? 'Resource',
        exception.metadata?.identifier ?? 'unknown',
      );
    }

    if (exception instanceof AlreadyExistsException) {
      return CrmError.conflict(
        exception.metadata?.entityName ?? 'Resource',
        'identifier',
        exception.metadata?.identifier,
      );
    }

    if (exception instanceof InvalidDataException) {
      return CrmError.validation(
        exception.metadata?.entityName ?? 'data',
        exception.metadata?.reason ?? exception.message,
      );
    }

    if (exception instanceof BusinessRuleException) {
      return CrmError.businessRule(
        exception.metadata?.rule ?? 'unknown',
        exception.metadata?.reason ?? exception.message,
        exception.metadata,
      );
    }

    if (exception instanceof VersionConflictException) {
      return CrmError.versionConflict(
        exception.metadata?.entityName ?? 'Resource',
        exception.metadata?.identifier ?? 'unknown',
        exception.metadata?.expectedVersion ?? 0,
        exception.metadata?.actualVersion ?? 0,
      );
    }

    if (exception instanceof UnauthorizedException) {
      return CrmError.permissionDenied(
        exception.metadata?.operation ?? 'access',
        'resource',
        exception.metadata?.reason,
      );
    }

    // Generic DomainException
    return new CrmError(CrmErrorCode.INTERNAL_ERROR, exception.message, exception.metadata);
  }

  /**
   * Handle NestJS BadRequestException
   */
  private handleBadRequestException(exception: BadRequestException, correlationId?: string): GrpcException {
    const response = exception.getResponse();

    if (typeof response === 'object' && response !== null) {
      const resp = response as { message?: string | string[] };
      const messages = Array.isArray(resp.message) ? resp.message : [resp.message ?? 'Bad request'];
      const crmError = CrmError.validationMultiple(
        messages.map((msg) => ({ field: 'request', message: msg ?? 'Invalid' })),
      );
      return toGrpcException(crmError, correlationId);
    }

    return toGrpcException(CrmError.validation('request', String(response)), correlationId);
  }

  /**
   * Handle TypeORM-specific errors
   */
  private handleTypeOrmException(exception: Error, correlationId?: string): GrpcException | null {
    const errorName = exception.constructor.name;

    // EntityNotFoundError
    if (errorName === TYPEORM_ERROR_NAMES.EntityNotFoundError) {
      const match = exception.message.match(/Could not find any entity of type "(\w+)"/);
      const entityName = match?.[1] ?? 'Entity';
      const crmError = CrmError.notFound(entityName, 'unknown');
      return toGrpcException(crmError, correlationId);
    }

    // OptimisticLockVersionMismatchError
    if (errorName === TYPEORM_ERROR_NAMES.OptimisticLockVersionMismatchError) {
      const crmError = CrmError.versionConflict('Entity', 'unknown', 0, 0);
      return toGrpcException(crmError, correlationId);
    }

    // QueryFailedError - check for constraint violations
    if (errorName === TYPEORM_ERROR_NAMES.QueryFailedError) {
      return this.handleQueryFailedError(exception, correlationId);
    }

    return null;
  }

  /**
   * Handle PostgreSQL query errors
   */
  private handleQueryFailedError(exception: Error, correlationId?: string): GrpcException {
    const pgError = exception as Error & { code?: string; detail?: string; constraint?: string };

    switch (pgError.code) {
      case PG_ERROR_CODES.UNIQUE_VIOLATION: {
        // Extract field from constraint name or detail
        const field = this.extractFieldFromConstraint(pgError.constraint, pgError.detail);
        const crmError = CrmError.conflict('Resource', field, 'duplicate');
        return toGrpcException(crmError, correlationId);
      }

      case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
        const crmError = CrmError.validation(
          'foreignKey',
          'Referenced record does not exist',
          { constraint: pgError.constraint },
        );
        return toGrpcException(crmError, correlationId);
      }

      case PG_ERROR_CODES.NOT_NULL_VIOLATION: {
        const field = this.extractFieldFromConstraint(pgError.constraint, pgError.detail) ?? 'field';
        const crmError = CrmError.validation(field, 'Cannot be null');
        return toGrpcException(crmError, correlationId);
      }

      case PG_ERROR_CODES.CHECK_VIOLATION: {
        const crmError = CrmError.validation(
          'constraint',
          'Check constraint violated',
          { constraint: pgError.constraint },
        );
        return toGrpcException(crmError, correlationId);
      }

      default:
        // Generic query error - don't expose SQL details
        return new GrpcInternalException('Database operation failed', exception, correlationId);
    }
  }

  /**
   * Extract field name from PostgreSQL constraint info
   */
  private extractFieldFromConstraint(constraint?: string, detail?: string): string {
    // Try to extract from detail like "Key (email)=(test@test.com) already exists"
    if (detail) {
      const match = detail.match(/Key \((\w+)\)/);
      if (match?.[1]) {
        return match[1];
      }
    }

    // Try to extract from constraint name like "users_email_key"
    if (constraint) {
      const parts = constraint.split('_');
      if (parts.length >= 2) {
        return parts[parts.length - 2] ?? 'field';
      }
    }

    return 'field';
  }

  /**
   * Map gRPC status code to CrmErrorCode
   */
  private grpcStatusToCrmCode(grpcStatus: number): CrmErrorCode {
    const mapping: Record<number, CrmErrorCode> = {
      [GrpcStatus.NOT_FOUND]: CrmErrorCode.NOT_FOUND,
      [GrpcStatus.INVALID_ARGUMENT]: CrmErrorCode.VALIDATION_ERROR,
      [GrpcStatus.ALREADY_EXISTS]: CrmErrorCode.CONFLICT,
      [GrpcStatus.UNAUTHENTICATED]: CrmErrorCode.UNAUTHORIZED,
      [GrpcStatus.PERMISSION_DENIED]: CrmErrorCode.PERMISSION_DENIED,
      [GrpcStatus.FAILED_PRECONDITION]: CrmErrorCode.BUSINESS_RULE_VIOLATION,
      [GrpcStatus.ABORTED]: CrmErrorCode.VERSION_CONFLICT,
      [GrpcStatus.DEADLINE_EXCEEDED]: CrmErrorCode.TIMEOUT,
      [GrpcStatus.RESOURCE_EXHAUSTED]: CrmErrorCode.RATE_LIMITED,
      [GrpcStatus.UNAVAILABLE]: CrmErrorCode.EXTERNAL_SERVICE_ERROR,
    };

    return mapping[grpcStatus] ?? CrmErrorCode.INTERNAL_ERROR;
  }

  /**
   * Build error response for gRPC transport
   */
  private buildErrorResponse(grpcException: GrpcException): GrpcErrorResponse {
    return {
      code: grpcException.grpcStatus,
      message: grpcException.crmError.message,
      details: {
        crmErrorCode: grpcException.crmError.code,
        ...grpcException.crmError.details,
        timestamp: grpcException.crmError.timestamp.toISOString(),
      },
    };
  }

  /**
   * Sanitize error message for internal errors (hide implementation details)
   */
  private sanitizeErrorMessage(exception: Error): string {
    // List of sensitive patterns to hide
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /credential/i,
      /api[_-]?key/i,
      /connection.*string/i,
    ];

    const message = exception.message;

    // Check if message contains sensitive information
    if (sensitivePatterns.some((pattern) => pattern.test(message))) {
      return 'An internal error occurred';
    }

    // For truly internal errors, provide generic message
    if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
      return 'Service temporarily unavailable';
    }

    // Hide SQL errors
    if (message.includes('SELECT') || message.includes('INSERT') || message.includes('UPDATE')) {
      return 'Database operation failed';
    }

    // Keep the message but ensure it's not too long
    return message.length > 200 ? `${message.substring(0, 200)}...` : message;
  }

  /**
   * Extract correlation ID from request data
   */
  private extractCorrelationId(data: unknown): string {
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      return (d.correlationId ?? d.correlation_id ?? d.requestId ?? d.eventId ?? 'unknown') as string;
    }
    return 'unknown';
  }

  /**
   * Structured logging
   */
  private logException(
    originalException: Error,
    grpcException: GrpcException,
    correlationId: string,
    requestData: unknown,
  ): void {
    const logContext = {
      correlationId,
      grpcStatus: grpcException.grpcStatus,
      grpcStatusName: GRPC_STATUS_NAMES[grpcException.grpcStatus] ?? 'UNKNOWN',
      crmErrorCode: grpcException.crmError.code,
      exceptionType: originalException.constructor.name,
      message: grpcException.crmError.message,
      details: grpcException.crmError.details,
      timestamp: grpcException.crmError.timestamp.toISOString(),
    };

    if (this.isClientError(grpcException.grpcStatus)) {
      // Client errors: warn level, no stack trace
      this.logger.warn('Client error in gRPC call', logContext);
    } else {
      // Server errors: error level, include stack trace and request data
      this.logger.error('Server error in gRPC call', {
        ...logContext,
        stack: originalException.stack,
        requestData: this.sanitizeRequestData(requestData),
      });
    }
  }

  /**
   * Check if status is a client error (4xx equivalent)
   */
  private isClientError(grpcStatus: number): boolean {
    return [
      GrpcStatus.INVALID_ARGUMENT,
      GrpcStatus.NOT_FOUND,
      GrpcStatus.ALREADY_EXISTS,
      GrpcStatus.PERMISSION_DENIED,
      GrpcStatus.FAILED_PRECONDITION,
      GrpcStatus.ABORTED,
      GrpcStatus.OUT_OF_RANGE,
      GrpcStatus.UNAUTHENTICATED,
    ].includes(grpcStatus);
  }

  /**
   * Sanitize request data for logging (remove sensitive fields)
   */
  private sanitizeRequestData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'api_key', 'credential'];
    const sanitized = { ...data } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Re-export the old filter name for backward compatibility
export { EnhancedGrpcExceptionFilter as GrpcExceptionFilter };
