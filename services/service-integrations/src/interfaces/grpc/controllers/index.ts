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

// WooCommerce integration controllers
// export * from './woocommerce/woocommerce.controller';

// WinLeadPlus integration controllers
// export * from './winleadplus/winleadplus.controller';

// CFast integration controllers
// export * from './cfast/cfast.controller';

// MondialTV integration controllers
// export * from './mondial-tv/mondial-tv.controller';

// ReducBox integration controllers
// export * from './reducbox/reducbox.controller';
