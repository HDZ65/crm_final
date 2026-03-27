/**
 * @crm/shared-kernel
 *
 * Shared Domain-Driven Design kernel containing:
 * - Value Objects: Immutable domain primitives
 * - Domain Base Classes: AggregateRoot, DomainEvent
 * - Domain Events: Shared events across services
 * - Persistence: Base repository, ORM entities, TypeORM config
 * - Events: Base event handler for NATS publishing
 * - Helpers: Pagination, Timestamp utilities
 * - Validation: Command validation helpers
 * - Infrastructure: gRPC, filters, interceptors, logging, health, NATS
 * - Constants & Enums: Shared defaults and status enums
 *
 * @module @crm/shared-kernel
 */

// Re-export constants and enums
export * from './constants';

// Re-export domain base classes and events
export * from './domain';
export * from './enums';
// Re-export event handling
export * from './events';
// Re-export domain exceptions
export * from './exceptions';

// Note: The unified error system is available via subpath import:
// import { CrmError, assertFound, GrpcNotFoundException } from '@crm/shared-kernel/errors';

// Re-export helpers
export * from './helpers';
// Re-export infrastructure components
export * from './infrastructure';
// Re-export persistence layer
export * from './persistence';
// Re-export storage abstraction
export * from './storage';
// Re-export string utilities
export * from './utils';
// Re-export validation
export * from './validation';
// Re-export all value objects
export * from './value-objects';
