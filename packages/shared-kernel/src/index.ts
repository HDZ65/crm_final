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

// Re-export all value objects
export * from './value-objects/index.js';

// Re-export domain base classes and events
export * from './domain/index.js';

// Re-export domain exceptions
export * from './exceptions/index.js';

// Re-export persistence layer
export * from './persistence/index.js';

// Re-export event handling
export * from './events/index.js';

// Re-export helpers
export * from './helpers/index.js';

// Re-export validation
export * from './validation/index.js';

// Re-export infrastructure components
export * from './infrastructure/index.js';

// Re-export string utilities
export * from './utils/index.js';

// Re-export constants and enums
export * from './constants/index.js';
export * from './enums/index.js';
