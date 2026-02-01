/**
 * @crm/shared - Shared utilities, constants, and types for CRM microservices
 * 
 * @example
 * ```typescript
 * import { PaginationUtil, ClientStatus, DEFAULT_TVA_RATE } from '@crm/shared';
 * ```
 * 
 * Note: For gRPC/proto utilities, use @crm/grpc-utils instead:
 * ```typescript
 * import { getGrpcOptions, resolveProtoPath } from '@crm/grpc-utils';
 * ```
 */

// Utilities
export { PaginationUtil } from './utils/pagination.util';

// Constants
export * from './constants/defaults';

// Enums
export * from './enums/statut.enum';
