/**
 * Dynamic gRPC client loader using proto-loader
 * This avoids importing generated proto files that contain NestJS dependencies
 */

import { credentials, loadPackageDefinition, type ServiceError } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { join } from "path";

// Cache for loaded clients
const clientCache = new Map<string, unknown>();

// Proto loader options
const PROTO_OPTIONS = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

/**
 * Load a gRPC service client dynamically
 */
export function loadServiceClient<T>(
  protoPath: string,
  packageName: string,
  serviceName: string,
  address: string
): T {
  const cacheKey = `${packageName}.${serviceName}@${address}`;
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as T;
  }

  const fullPath = join(process.cwd(), protoPath);
  const includeDirs = [join(process.cwd(), "proto/src")];

  const packageDef = loadSync(fullPath, { ...PROTO_OPTIONS, includeDirs });
  const grpcObj = loadPackageDefinition(packageDef);

  // Navigate to the service (e.g., grpcObj.clients.ClientBaseService)
  const parts = packageName.split(".");
  let serviceConstructor: unknown = grpcObj;
  for (const part of parts) {
    serviceConstructor = (serviceConstructor as Record<string, unknown>)[part];
  }
  serviceConstructor = (serviceConstructor as Record<string, unknown>)[serviceName];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ServiceClass = serviceConstructor as any;
  const client = new ServiceClass(address, credentials.createInsecure()) as T;

  clientCache.set(cacheKey, client);
  return client;
}

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

      if (!fn) {
        reject(new Error(`Method ${method} not found on client`));
        return;
      }

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
