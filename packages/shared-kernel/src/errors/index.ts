/**
 * CRM Unified Error System
 *
 * @module @crm/shared-kernel/errors
 *
 * @example
 * ```typescript
 * // In a gRPC controller
 * import {
 *   assertFound,
 *   assertValid,
 *   assertPermission,
 *   GrpcNotFoundException,
 *   GrpcValidationException,
 * } from '@crm/shared-kernel/errors';
 *
 * @GrpcMethod('ClientService', 'GetClient')
 * async getClient(data: GetClientRequest) {
 *   const client = await this.clientService.findById(data.id);
 *   assertFound(client, 'Client', data.id);
 *   return client;
 * }
 * ```
 */

// Core error class and types
export {
  CrmError,
  CrmErrorCode,
  type CrmErrorDetails,
  type CrmResult,
  ok,
  err,
  tryCrmResult,
} from './crm-error.js';

// gRPC typed exceptions
export {
  // Base class
  GrpcException,
  // Specific exceptions
  GrpcNotFoundException,
  GrpcValidationException,
  GrpcConflictException,
  GrpcVersionConflictException,
  GrpcUnauthorizedException,
  GrpcPermissionDeniedException,
  GrpcBusinessRuleException,
  GrpcDeadlineExceededException,
  GrpcExternalServiceException,
  GrpcRateLimitedException,
  GrpcInternalException,
  // Utilities
  toGrpcException,
  CRM_TO_GRPC_STATUS,
  GRPC_STATUS_NAMES,
} from './grpc-exceptions.js';

// Assertion helpers
export {
  assertFound,
  assertValid,
  assertDefined,
  assertNotEmpty,
  assertPermission,
  assertBusinessRule,
  assertNoConflict,
  assertArrayNotEmpty,
  assertOneOf,
  assertInRange,
  assertMatches,
  assertUuid,
  assertFutureDate,
  assertPastDate,
} from './assertions.js';

// Exception filter
export { EnhancedGrpcExceptionFilter, GrpcExceptionFilter } from './grpc-exception.filter.js';
