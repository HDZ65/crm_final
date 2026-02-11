/**
 * Shared gRPC configuration and utilities
 */

import * as grpc from "@grpc/grpc-js";
export const credentials = grpc.credentials;
export type ServiceError = import("@grpc/grpc-js").ServiceError;
export type GrpcClient = import("@grpc/grpc-js").Client;

/**
 * Create a gRPC client from a service definition (outputClientImpl=false pattern)
 * Uses grpc.makeClientConstructor instead of generated client classes
 */
export function makeClient(
  serviceDef: Record<string, unknown>,
  serviceName: string,
  address: string,
  channelCredentials: unknown
): GrpcClient {
  const Constructor = grpc.makeClientConstructor(serviceDef as any, serviceName);
  return new Constructor(address, channelCredentials as any);
}

// Service endpoints configuration
// Each consolidated service exposes all its proto packages on a single gRPC port
export const SERVICES = {
  // service-engagement :50051
  activites: process.env.GRPC_ACTIVITES_URL || "localhost:50051",
  email: process.env.GRPC_EMAIL_URL || "localhost:50051",
  notifications: process.env.GRPC_NOTIFICATIONS_URL || "localhost:50051",
  bundle: process.env.GRPC_BUNDLE_URL || "localhost:50051",
  conciergerie: process.env.GRPC_CONCIERGERIE_URL || "localhost:50051",
  justiPlus: process.env.GRPC_JUSTI_PLUS_URL || "localhost:50051",
  wincash: process.env.GRPC_WINCASH_URL || "localhost:50051",
  // service-core :50052
  users: process.env.GRPC_USERS_URL || "localhost:50052",
  clients: process.env.GRPC_CLIENTS_URL || "localhost:50052",
  dashboard: process.env.GRPC_DASHBOARD_URL || "localhost:50052",
  documents: process.env.GRPC_DOCUMENTS_URL || "localhost:50052",
  organisations: process.env.GRPC_ORGANISATIONS_URL || "localhost:50052",
  // service-commercial :50053
  commerciaux: process.env.GRPC_COMMERCIAUX_URL || "localhost:50053",
  commission: process.env.GRPC_COMMISSION_URL || "localhost:50053",
  contrats: process.env.GRPC_CONTRATS_URL || "localhost:50053",
  products: process.env.GRPC_PRODUCTS_URL || "localhost:50053",
  partenaires: process.env.GRPC_PARTENAIRES_URL || "localhost:50053",
  winleadplus: process.env.GRPC_WINLEADPLUS_URL || "localhost:50053",
  // service-finance :50059
  calendar: process.env.GRPC_CALENDAR_URL || "localhost:50059",
  factures: process.env.GRPC_FACTURES_URL || "localhost:50059",
  payments: process.env.GRPC_PAYMENTS_URL || "localhost:50059",
  // service-logistics :50060
  logistics: process.env.GRPC_LOGISTICS_URL || "localhost:50060",
  // service-depanssur :50061
  depanssur: process.env.GRPC_DEPANSSUR_URL || "localhost:50061",
  subscriptions: process.env.GRPC_SUBSCRIPTIONS_URL || "localhost:50053",
  woocommerce: process.env.GRPC_WOOCOMMERCE_URL || "localhost:50053",
  // not yet exposed
  referentiel: process.env.GRPC_REFERENTIEL_URL || "localhost:50052",
  relance: process.env.GRPC_RELANCE_URL || "localhost:50051",
  agenda: process.env.GRPC_AGENDA_URL || "localhost:50051",
} as const;

/**
 * Promisify a gRPC callback-style method.
 * Automatically injects auth metadata from the server session.
 */
/** gRPC status codes that indicate the backend method is not available */
const SUPPRESSED_CODES = new Set([
  grpc.status.UNIMPLEMENTED,
  grpc.status.UNKNOWN,
  grpc.status.UNAVAILABLE,
]);

export function promisify<TRequest, TResponse>(
  client: unknown,
  method: string
): (request: TRequest) => Promise<TResponse> {
  return async (request: TRequest): Promise<TResponse> => {
    const { getAuthMetadata } = await import("@/lib/grpc/auth");
    const metadata = await getAuthMetadata();

    return new Promise((resolve, reject) => {
      const fn = (client as Record<string, unknown>)[method] as (
        request: TRequest,
        metadata: grpc.Metadata,
        callback: (error: ServiceError | null, response: TResponse) => void
      ) => void;

      fn.call(client, request, metadata, (error, response) => {
        if (error) {
          if (SUPPRESSED_CODES.has(error.code)) {
            // Backend not ready — reject with a plain Error so Next.js dev
            // overlay doesn't treat it as an unhandled server error.
            reject(new Error(error.message));
          } else {
            reject(error);
          }
        } else {
          resolve(response);
        }
      });
    });
  };
}
