/**
 * React hooks pour utiliser les services Maileva avec authentification via gRPC
 * Migrated from REST ApiClient to gRPC — Wave 3 Task 8
 *
 * NOTE: This file re-exports from use-maileva.ts which now uses gRPC.
 * Authentication is handled automatically by gRPC metadata (getAuthMetadata).
 * Kept for backward compatibility — consumers should prefer use-maileva.ts directly.
 */

export {
  useMailevaLabel,
  useMailevaTracking,
  useMailevaPricing,
  useMailevaAddressValidation,
  useMaileva,
} from './use-maileva';