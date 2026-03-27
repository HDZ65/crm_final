/**
 * Interfaces Layer - Primary Adapters
 *
 * This layer contains the entry points to the application:
 * - gRPC controllers
 * - REST controllers (if any)
 * - CLI commands (if any)
 * - Event handlers (NATS subscriptions)
 */
export * from './grpc/index';
