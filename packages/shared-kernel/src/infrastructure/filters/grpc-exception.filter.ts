import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, BadRequestException, Catch, Logger, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import {
  AlreadyExistsException,
  BusinessRuleException,
  DomainException,
  InvalidDataException,
  NotFoundException,
  UnauthorizedException,
  VersionConflictException,
} from '../../exceptions/index';

/**
 * Error type following google.rpc.ErrorInfo specification
 * @see https://cloud.google.com/apis/design/errors#error_info
 */
interface ErrorInfo {
  '@type': 'type.googleapis.com/google.rpc.ErrorInfo';
  reason: string;
  domain: string;
  metadata: Record<string, string>;
}

/**
 * Debug info for development environments
 */
interface DebugInfo {
  '@type': 'type.googleapis.com/google.rpc.DebugInfo';
  detail: string;
  stackEntries: string[];
}

/**
 * Bad request field violation
 */
interface FieldViolation {
  field: string;
  description: string;
}

/**
 * Bad request details
 */
interface BadRequestDetails {
  '@type': 'type.googleapis.com/google.rpc.BadRequest';
  fieldViolations: FieldViolation[];
}

/**
 * Retry info for transient errors
 */
interface RetryInfo {
  '@type': 'type.googleapis.com/google.rpc.RetryInfo';
  retryDelay: string; // Duration format: "1.5s"
}

/**
 * Union of all error detail types
 */
type ErrorDetail = ErrorInfo | DebugInfo | BadRequestDetails | RetryInfo;

/**
 * Structured gRPC error response
 */
interface GrpcErrorResponse {
  code: number;
  message: string;
  details: ErrorDetail[];
}

/**
 * Service unavailable exception
 */
export class ServiceUnavailableException extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'ServiceUnavailableException';
  }
}

/**
 * Timeout exception
 */
export class TimeoutException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutException';
  }
}

/**
 * GrpcExceptionFilter - Maps domain exceptions to gRPC status codes
 *
 * Mapping:
 * - NotFoundException -> NOT_FOUND (5)
 * - AlreadyExistsException -> ALREADY_EXISTS (6)
 * - InvalidDataException -> INVALID_ARGUMENT (3)
 * - BusinessRuleException -> FAILED_PRECONDITION (9)
 * - VersionConflictException -> ABORTED (10)
 * - UnauthorizedException -> PERMISSION_DENIED (7)
 * - ServiceUnavailableException -> UNAVAILABLE (14)
 * - TimeoutException -> DEADLINE_EXCEEDED (4)
 * - BadRequestException -> INVALID_ARGUMENT (3)
 * - Others -> INTERNAL (13)
 *
 * @see https://grpc.io/docs/guides/error/
 * @see https://cloud.google.com/apis/design/errors
 */
@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter<Error> {
  private readonly logger = new Logger(GrpcExceptionFilter.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  private readonly errorDomain = process.env.ERROR_DOMAIN || 'crm.finanssor.com';

  catch(exception: Error, host: ArgumentsHost): Observable<never> {
    const ctx = host.switchToRpc();
    const data = ctx.getData();

    const correlationId = this.extractCorrelationId(data);
    const grpcStatus = this.getGrpcStatus(exception);
    const errorResponse = this.buildErrorResponse(exception, grpcStatus, correlationId);

    this.logException(exception, grpcStatus, correlationId, data);

    const rpcException = new RpcException(errorResponse) as RpcException & {
      code?: number;
      details?: ErrorDetail[];
    };
    rpcException.code = grpcStatus;
    rpcException.details = errorResponse.details;

    return throwError(() => rpcException);
  }

  /**
   * Map exception to gRPC status code
   */
  private getGrpcStatus(exception: Error): number {
    // Handle RpcException with existing code
    if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === 'object' && error !== null && 'code' in error) {
        return (error as { code: number }).code;
      }
      return GrpcStatus.UNKNOWN;
    }

    // Domain exceptions
    if (exception instanceof NotFoundException) return GrpcStatus.NOT_FOUND;
    if (exception instanceof AlreadyExistsException) return GrpcStatus.ALREADY_EXISTS;
    if (exception instanceof InvalidDataException) return GrpcStatus.INVALID_ARGUMENT;
    if (exception instanceof BusinessRuleException) return GrpcStatus.FAILED_PRECONDITION;
    if (exception instanceof VersionConflictException) return GrpcStatus.ABORTED;
    if (exception instanceof UnauthorizedException) return GrpcStatus.PERMISSION_DENIED;

    // Infrastructure exceptions
    if (exception instanceof ServiceUnavailableException) return GrpcStatus.UNAVAILABLE;
    if (exception instanceof TimeoutException) return GrpcStatus.DEADLINE_EXCEEDED;

    // NestJS exceptions
    if (exception instanceof BadRequestException) return GrpcStatus.INVALID_ARGUMENT;

    // Check for timeout-like errors
    if (exception.message?.includes('ETIMEDOUT') || exception.message?.includes('timeout')) {
      return GrpcStatus.DEADLINE_EXCEEDED;
    }

    // Check for connection errors
    if (exception.message?.includes('ECONNREFUSED') || exception.message?.includes('ENOTFOUND')) {
      return GrpcStatus.UNAVAILABLE;
    }

    return GrpcStatus.INTERNAL;
  }

  /**
   * Build structured error response following Google's error model
   */
  private buildErrorResponse(exception: Error, grpcStatus: number, correlationId: string): GrpcErrorResponse {
    const details: ErrorDetail[] = [];

    // Add ErrorInfo for domain exceptions
    if (exception instanceof DomainException) {
      details.push({
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: exception.code || exception.constructor.name.toUpperCase(),
        domain: this.errorDomain,
        metadata: {
          correlationId,
          exceptionType: exception.constructor.name,
          ...this.sanitizeMetadata(exception.metadata),
        },
      });
    }

    // Add BadRequest details for validation errors
    if (exception instanceof InvalidDataException || exception instanceof BadRequestException) {
      const fieldViolations = this.extractFieldViolations(exception);
      if (fieldViolations.length > 0) {
        details.push({
          '@type': 'type.googleapis.com/google.rpc.BadRequest',
          fieldViolations,
        });
      }
    }

    // Add RetryInfo for transient errors
    if (exception instanceof ServiceUnavailableException && exception.retryAfterMs) {
      details.push({
        '@type': 'type.googleapis.com/google.rpc.RetryInfo',
        retryDelay: `${exception.retryAfterMs / 1000}s`,
      });
    }

    // Add DebugInfo in development
    if (this.isDevelopment && exception.stack) {
      details.push({
        '@type': 'type.googleapis.com/google.rpc.DebugInfo',
        detail: exception.message,
        stackEntries: exception.stack.split('\n').slice(0, 10),
      });
    }

    return {
      code: grpcStatus,
      message: this.sanitizeErrorMessage(exception.message, grpcStatus),
      details,
    };
  }

  /**
   * Extract field violations from validation exceptions
   */
  private extractFieldViolations(exception: Error): FieldViolation[] {
    const violations: FieldViolation[] = [];

    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const resp = response as { message?: string | string[] };
        if (Array.isArray(resp.message)) {
          resp.message.forEach((msg) => {
            const match = msg.match(/^(\w+)\s+(.+)$/);
            if (match && match[1] && match[2]) {
              violations.push({ field: match[1], description: match[2] });
            } else {
              violations.push({ field: 'unknown', description: msg });
            }
          });
        }
      }
    }

    if (exception instanceof InvalidDataException) {
      const metadata = (exception as DomainException).metadata;
      if (metadata?.field) {
        violations.push({
          field: String(metadata.field),
          description: exception.message,
        });
      }
    }

    return violations;
  }

  /**
   * Sanitize metadata values to strings
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, string> {
    if (!metadata) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        result[key] = String(value);
      }
    }
    return result;
  }

  /**
   * Sanitize error message for external consumption
   */
  private sanitizeErrorMessage(message: string, grpcStatus: number): string {
    // In production, hide internal error details
    if (!this.isDevelopment && grpcStatus === GrpcStatus.INTERNAL) {
      return 'An internal error occurred. Please try again later.';
    }
    return message;
  }

  /**
   * Extract correlation ID from request data
   */
  private extractCorrelationId(data: unknown): string {
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      return String(d.correlationId || d.correlation_id || d.eventId || d.event_id || 'unknown');
    }
    return 'unknown';
  }

  /**
   * Log exception with structured context
   */
  private logException(exception: Error, grpcStatus: number, correlationId: string, data: unknown): void {
    const logContext = {
      correlationId,
      grpcStatus,
      grpcStatusName: this.getStatusName(grpcStatus),
      exceptionType: exception.constructor.name,
      message: exception.message,
      ...(exception instanceof DomainException && {
        code: exception.code,
        metadata: exception.metadata,
      }),
    };

    if (this.isClientError(grpcStatus)) {
      this.logger.warn('Client error in gRPC call', logContext);
    } else {
      this.logger.error('Server error in gRPC call', {
        ...logContext,
        stack: exception.stack,
        // Only log request data in development
        ...(this.isDevelopment && { requestData: data }),
      });
    }
  }

  /**
   * Check if status code represents a client error
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
   * Get human-readable status name
   */
  private getStatusName(code: number): string {
    const statusNames: Record<number, string> = {
      [GrpcStatus.OK]: 'OK',
      [GrpcStatus.CANCELLED]: 'CANCELLED',
      [GrpcStatus.UNKNOWN]: 'UNKNOWN',
      [GrpcStatus.INVALID_ARGUMENT]: 'INVALID_ARGUMENT',
      [GrpcStatus.DEADLINE_EXCEEDED]: 'DEADLINE_EXCEEDED',
      [GrpcStatus.NOT_FOUND]: 'NOT_FOUND',
      [GrpcStatus.ALREADY_EXISTS]: 'ALREADY_EXISTS',
      [GrpcStatus.PERMISSION_DENIED]: 'PERMISSION_DENIED',
      [GrpcStatus.RESOURCE_EXHAUSTED]: 'RESOURCE_EXHAUSTED',
      [GrpcStatus.FAILED_PRECONDITION]: 'FAILED_PRECONDITION',
      [GrpcStatus.ABORTED]: 'ABORTED',
      [GrpcStatus.OUT_OF_RANGE]: 'OUT_OF_RANGE',
      [GrpcStatus.UNIMPLEMENTED]: 'UNIMPLEMENTED',
      [GrpcStatus.INTERNAL]: 'INTERNAL',
      [GrpcStatus.UNAVAILABLE]: 'UNAVAILABLE',
      [GrpcStatus.DATA_LOSS]: 'DATA_LOSS',
      [GrpcStatus.UNAUTHENTICATED]: 'UNAUTHENTICATED',
    };

    return statusNames[code] || 'UNKNOWN';
  }
}
