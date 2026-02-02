/**
 * Shared gRPC configuration and utilities
 */

// Use require to bypass ESM bundling issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const grpc = require("@grpc/grpc-js");
export const credentials = grpc.credentials;
export type ServiceError = import("@grpc/grpc-js").ServiceError;

// Service endpoints configuration
// Note: Les ports correspondent aux conteneurs Docker des microservices
export const SERVICES = {
  activites: process.env.GRPC_ACTIVITES_URL || "localhost:60051",
  calendar: process.env.GRPC_CALENDAR_URL || "localhost:50070",
  clients: process.env.GRPC_CLIENTS_URL || "localhost:60052",
  commerciaux: process.env.GRPC_COMMERCIAUX_URL || "localhost:60053",
  commission: process.env.GRPC_COMMISSION_URL || "localhost:60054",
  contrats: process.env.GRPC_CONTRATS_URL || "localhost:60055",
  dashboard: process.env.GRPC_DASHBOARD_URL || "localhost:60056",
  documents: process.env.GRPC_DOCUMENTS_URL || "localhost:60057",
  email: process.env.GRPC_EMAIL_URL || "localhost:60058",
  factures: process.env.GRPC_FACTURES_URL || "localhost:60059",
  logistics: process.env.GRPC_LOGISTICS_URL || "localhost:60060",
  notifications: process.env.GRPC_NOTIFICATIONS_URL || "localhost:60061",
  organisations: process.env.GRPC_ORGANISATIONS_URL || "localhost:60062",
  payments: process.env.GRPC_PAYMENTS_URL || "localhost:60063",
  products: process.env.GRPC_PRODUCTS_URL || "localhost:60064",
  referentiel: process.env.GRPC_REFERENTIEL_URL || "localhost:60065",
  relance: process.env.GRPC_RELANCE_URL || "localhost:60066",
  users: process.env.GRPC_USERS_URL || "localhost:60067",
} as const;

/**
 * Promisify a gRPC callback-style method
 */
export function promisify<TRequest, TResponse>(
  client: unknown,
  method: string
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      const fn = (client as Record<string, unknown>)[method] as (
        request: TRequest,
        callback: (error: ServiceError | null, response: TResponse) => void
      ) => void;

      fn.call(client, request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}
