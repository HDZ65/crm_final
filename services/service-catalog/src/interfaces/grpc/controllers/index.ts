/**
 * gRPC Controllers - Primary Adapters (Driving Side)
 *
 * Following Hexagonal Architecture:
 * - interfaces/ contains primary adapters (entry points: REST, gRPC, CLI, etc.)
 * - infrastructure/ contains secondary adapters (driven: repositories, external APIs, etc.)
 *
 * Controllers should:
 * - Handle protocol-specific concerns (gRPC metadata, error mapping)
 * - Delegate business logic to application services or domain layer
 * - Be thin wrappers around use cases
 */

// Product controllers
// export * from './products/product.controller';

// Subscription controllers
// export * from './subscriptions/subscription.controller';
