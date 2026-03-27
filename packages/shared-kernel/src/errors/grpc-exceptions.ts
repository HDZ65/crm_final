/**
 * gRPC Typed Exceptions
 *
 * Pre-configured exceptions that automatically map to correct gRPC status codes.
 * Eliminates the need for dynamic imports of RpcException and grpc-js status.
 *
 * @module @crm/shared-kernel/errors
 */

import { status as GrpcStatus } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { CrmError, CrmErrorCode, CrmErrorDetails } from './crm-error.js';

/**
 * Mapping from CrmErrorCode to gRPC status codes
 */
export const CRM_TO_GRPC_STATUS: Record<CrmErrorCode, number> = {
  [CrmErrorCode.VALIDATION_ERROR]: GrpcStatus.INVALID_ARGUMENT,
  [CrmErrorCode.NOT_FOUND]: GrpcStatus.NOT_FOUND,
  [CrmErrorCode.CONFLICT]: GrpcStatus.ALREADY_EXISTS,
  [CrmErrorCode.UNAUTHORIZED]: GrpcStatus.UNAUTHENTICATED,
  [CrmErrorCode.PERMISSION_DENIED]: GrpcStatus.PERMISSION_DENIED,
  [CrmErrorCode.BUSINESS_RULE_VIOLATION]: GrpcStatus.FAILED_PRECONDITION,
  [CrmErrorCode.VERSION_CONFLICT]: GrpcStatus.ABORTED,
  [CrmErrorCode.EXTERNAL_SERVICE_ERROR]: GrpcStatus.UNAVAILABLE,
  [CrmErrorCode.TIMEOUT]: GrpcStatus.DEADLINE_EXCEEDED,
  [CrmErrorCode.RATE_LIMITED]: GrpcStatus.RESOURCE_EXHAUSTED,
  [CrmErrorCode.INTERNAL_ERROR]: GrpcStatus.INTERNAL,
};

/**
 * gRPC status code names for logging
 */
export const GRPC_STATUS_NAMES: Record<number, string> = {
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

/**
 * Base gRPC exception with automatic status code mapping
 */
export abstract class GrpcException extends RpcException {
  public readonly grpcStatus: number;
  public readonly crmError: CrmError;
  public readonly metadata: Metadata;

  constructor(crmError: CrmError, correlationId?: string) {
    const grpcStatus = CRM_TO_GRPC_STATUS[crmError.code];

    // Build gRPC metadata
    const metadata = new Metadata();
    metadata.set('crm-error-code', crmError.code);
    metadata.set('timestamp', crmError.timestamp.toISOString());
    if (correlationId) {
      metadata.set('correlation-id', correlationId);
    }

    // RpcException payload
    super({
      code: grpcStatus,
      message: crmError.message,
      details: crmError.details,
    });

    this.grpcStatus = grpcStatus;
    this.crmError = crmError;
    this.metadata = metadata;
    this.name = this.constructor.name;
  }

  /**
   * Get gRPC status name
   */
  getStatusName(): string {
    return GRPC_STATUS_NAMES[this.grpcStatus] ?? 'UNKNOWN';
  }
}

/**
 * NOT_FOUND (5) - Resource does not exist
 *
 * @example
 * throw new GrpcNotFoundException('Client', clientId);
 */
export class GrpcNotFoundException extends GrpcException {
  constructor(resource: string, identifier: string | Record<string, unknown>, correlationId?: string) {
    super(CrmError.notFound(resource, identifier), correlationId);
  }
}

/**
 * INVALID_ARGUMENT (3) - Validation error
 *
 * @example
 * throw new GrpcValidationException('email', 'Invalid email format');
 * throw GrpcValidationException.multiple([
 *   { field: 'email', message: 'Required' },
 *   { field: 'phone', message: 'Invalid format' },
 * ]);
 */
export class GrpcValidationException extends GrpcException {
  constructor(field: string, message: string, details?: CrmErrorDetails, correlationId?: string) {
    super(CrmError.validation(field, message, details), correlationId);
  }

  static multiple(
    errors: Array<{ field: string; message: string }>,
    correlationId?: string,
  ): GrpcValidationException {
    const error = CrmError.validationMultiple(errors);
    return new GrpcValidationException('multiple', error.message, { errors }, correlationId);
  }
}

/**
 * ALREADY_EXISTS (6) - Resource conflict
 *
 * @example
 * throw new GrpcConflictException('Email', 'email', email);
 */
export class GrpcConflictException extends GrpcException {
  constructor(resource: string, field: string, value: unknown, correlationId?: string) {
    super(CrmError.conflict(resource, field, value), correlationId);
  }
}

/**
 * ABORTED (10) - Version conflict (optimistic locking)
 *
 * @example
 * throw new GrpcVersionConflictException('Contrat', contratId, 5, 3);
 */
export class GrpcVersionConflictException extends GrpcException {
  constructor(
    resource: string,
    identifier: string,
    expected: number,
    actual: number,
    correlationId?: string,
  ) {
    super(CrmError.versionConflict(resource, identifier, expected, actual), correlationId);
  }
}

/**
 * UNAUTHENTICATED (16) - User not authenticated
 *
 * @example
 * throw new GrpcUnauthorizedException();
 * throw new GrpcUnauthorizedException('Token expired');
 */
export class GrpcUnauthorizedException extends GrpcException {
  constructor(message?: string, correlationId?: string) {
    super(CrmError.unauthorized(message), correlationId);
  }
}

/**
 * PERMISSION_DENIED (7) - User lacks permission
 *
 * @example
 * throw new GrpcPermissionDeniedException('delete', 'Client');
 * throw new GrpcPermissionDeniedException('update', 'Facture', 'Invoice is finalized');
 */
export class GrpcPermissionDeniedException extends GrpcException {
  constructor(action: string, resource: string, reason?: string, correlationId?: string) {
    super(CrmError.permissionDenied(action, resource, reason), correlationId);
  }
}

/**
 * FAILED_PRECONDITION (9) - Business rule violation
 *
 * @example
 * throw new GrpcBusinessRuleException('client_active', 'Client must be active to create expedition');
 */
export class GrpcBusinessRuleException extends GrpcException {
  constructor(rule: string, reason: string, details?: CrmErrorDetails, correlationId?: string) {
    super(CrmError.businessRule(rule, reason, details), correlationId);
  }
}

/**
 * DEADLINE_EXCEEDED (4) - Timeout
 *
 * @example
 * throw new GrpcDeadlineExceededException('carrier_api_call', 30000);
 */
export class GrpcDeadlineExceededException extends GrpcException {
  constructor(operation: string, timeoutMs: number, correlationId?: string) {
    super(CrmError.timeout(operation, timeoutMs), correlationId);
  }
}

/**
 * UNAVAILABLE (14) - External service error
 *
 * @example
 * throw new GrpcExternalServiceException('Stripe', 'Payment failed');
 */
export class GrpcExternalServiceException extends GrpcException {
  constructor(service: string, message: string, cause?: Error, correlationId?: string) {
    super(CrmError.externalService(service, message, cause), correlationId);
  }
}

/**
 * RESOURCE_EXHAUSTED (8) - Rate limited
 *
 * @example
 * throw new GrpcRateLimitedException('api_calls');
 */
export class GrpcRateLimitedException extends GrpcException {
  constructor(resource: string, retryAfterMs?: number, correlationId?: string) {
    super(CrmError.rateLimited(resource, retryAfterMs), correlationId);
  }
}

/**
 * INTERNAL (13) - Internal error (hides implementation details)
 *
 * @example
 * throw new GrpcInternalException('An unexpected error occurred');
 */
export class GrpcInternalException extends GrpcException {
  constructor(message = 'Internal server error', cause?: Error, correlationId?: string) {
    super(CrmError.internal(message, cause), correlationId);
  }
}

/**
 * Convert any error to appropriate GrpcException
 */
export function toGrpcException(error: unknown, correlationId?: string): GrpcException {
  if (error instanceof GrpcException) {
    return error;
  }

  if (error instanceof CrmError) {
    // Create appropriate GrpcException based on CrmError code
    switch (error.code) {
      case CrmErrorCode.NOT_FOUND:
        return new GrpcNotFoundException(
          error.details.resource ?? 'Resource',
          error.details.identifier ?? 'unknown',
          correlationId,
        );
      case CrmErrorCode.VALIDATION_ERROR:
        return new GrpcValidationException(
          error.details.field ?? 'unknown',
          error.message,
          error.details,
          correlationId,
        );
      case CrmErrorCode.CONFLICT:
        return new GrpcConflictException(
          error.details.resource ?? 'Resource',
          error.details.field ?? 'unknown',
          error.details.value,
          correlationId,
        );
      default:
        // Generic wrapper
        return new GrpcInternalException(error.message, error.cause, correlationId);
    }
  }

  if (error instanceof RpcException) {
    // Already an RpcException, wrap it
    const rpcError = error.getError();
    const message = typeof rpcError === 'string' ? rpcError : (rpcError as { message?: string }).message ?? 'RPC error';
    return new GrpcInternalException(message, error, correlationId);
  }

  if (error instanceof Error) {
    return new GrpcInternalException(error.message, error, correlationId);
  }

  return new GrpcInternalException(String(error), undefined, correlationId);
}
