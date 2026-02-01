/**
 * gRPC Client Factory
 * 
 * Utilities for creating gRPC clients with proper proto loading
 */

import { credentials, loadPackageDefinition, ChannelCredentials } from '@grpc/grpc-js';
import { loadSync, Options as ProtoLoaderOptions } from '@grpc/proto-loader';
import { getProtoLoaderConfig, resolveProtoPath } from './proto-loader';
import { getServiceConfig, getServiceUrl, ServiceName } from './service-config';

export interface GrpcClientOptions {
  /** Service URL override (defaults to service registry URL) */
  url?: string;
  /** Channel credentials (defaults to insecure) */
  credentials?: ChannelCredentials;
  /** Additional proto loader options */
  loaderOptions?: Partial<ProtoLoaderOptions>;
}

export interface GrpcClientConfig {
  protoPath: string;
  includeDirs: string[];
  url: string;
  packageName: string;
}

/**
 * Get gRPC client configuration for a registered service
 * 
 * @example
 * ```typescript
 * import { getGrpcClientConfig } from '@crm/grpc-utils';
 * 
 * const config = getGrpcClientConfig('organisations');
 * // { protoPath: '...', includeDirs: [...], url: '...', packageName: 'organisations' }
 * ```
 */
export function getGrpcClientConfig(
  serviceName: ServiceName,
  options?: GrpcClientOptions
): GrpcClientConfig {
  const serviceConfig = getServiceConfig(serviceName);
  const protoConfig = getProtoLoaderConfig(serviceConfig.protoFile);
  
  return {
    protoPath: protoConfig.protoPath,
    includeDirs: protoConfig.includeDirs,
    url: options?.url || getServiceUrl(serviceName),
    packageName: serviceConfig.package,
  };
}

/**
 * Load a gRPC package definition
 * 
 * @example
 * ```typescript
 * import { loadGrpcPackage } from '@crm/grpc-utils';
 * 
 * const pkg = loadGrpcPackage('organisations');
 * const client = new pkg.organisations.OrganisationService(url, credentials);
 * ```
 */
export function loadGrpcPackage(
  serviceName: ServiceName,
  options?: Pick<GrpcClientOptions, 'loaderOptions'>
): any {
  const serviceConfig = getServiceConfig(serviceName);
  const protoConfig = getProtoLoaderConfig(serviceConfig.protoFile);
  
  const packageDef = loadSync(protoConfig.protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: protoConfig.includeDirs,
    ...options?.loaderOptions,
  });
  
  return loadPackageDefinition(packageDef);
}

/**
 * Create a gRPC client for a specific service
 * 
 * @example
 * ```typescript
 * import { createGrpcClient } from '@crm/grpc-utils';
 * 
 * // Create client for organisations service
 * const organisationClient = createGrpcClient('organisations', 'OrganisationService');
 * 
 * // Use the client
 * organisationClient.create({ nom: 'Test Org' }, (err, response) => {
 *   if (err) console.error(err);
 *   else console.log(response);
 * });
 * ```
 */
export function createGrpcClient<T = any>(
  serviceName: ServiceName,
  grpcServiceName: string,
  options?: GrpcClientOptions
): T {
  const config = getGrpcClientConfig(serviceName, options);
  const grpcPackage = loadGrpcPackage(serviceName, options);
  
  const ServiceClass = grpcPackage[config.packageName]?.[grpcServiceName];
  if (!ServiceClass) {
    throw new Error(
      `Service ${grpcServiceName} not found in package ${config.packageName}. ` +
      `Available services: ${Object.keys(grpcPackage[config.packageName] || {}).join(', ')}`
    );
  }
  
  const creds = options?.credentials || credentials.createInsecure();
  return new ServiceClass(config.url, creds) as T;
}

/**
 * Create a promisified gRPC client wrapper
 * 
 * Wraps callback-style gRPC methods into Promise-based methods.
 * 
 * @example
 * ```typescript
 * import { createPromisifiedGrpcClient } from '@crm/grpc-utils';
 * 
 * const client = createPromisifiedGrpcClient('organisations', 'OrganisationService');
 * 
 * // Now use async/await
 * const org = await client.create({ nom: 'Test Org' });
 * const orgs = await client.list({ pagination: { page: 1, limit: 10 } });
 * ```
 */
export function createPromisifiedGrpcClient<T extends Record<string, any>>(
  serviceName: ServiceName,
  grpcServiceName: string,
  options?: GrpcClientOptions
): { [K in keyof T]: T[K] extends (req: infer Req, cb: (err: any, res: infer Res) => void) => void 
  ? (req: Req) => Promise<Res> 
  : T[K] } {
  
  const client = createGrpcClient(serviceName, grpcServiceName, options);
  
  return new Proxy(client, {
    get(target, prop) {
      const method = target[prop];
      if (typeof method === 'function' && prop !== 'close' && prop !== 'getChannel') {
        return (request: any) => new Promise((resolve, reject) => {
          method.call(target, request, (error: any, response: any) => {
            if (error) reject(error);
            else resolve(response);
          });
        });
      }
      return method;
    }
  }) as any;
}

/**
 * NestJS-compatible gRPC client module options
 * 
 * Use this in a NestJS module to register a gRPC client.
 * 
 * @example
 * ```typescript
 * import { ClientsModule } from '@nestjs/microservices';
 * import { getGrpcClientModuleOptions } from '@crm/grpc-utils';
 * 
 * @Module({
 *   imports: [
 *     ClientsModule.register([
 *       getGrpcClientModuleOptions('USERS_SERVICE', 'users'),
 *     ]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export function getGrpcClientModuleOptions(
  clientName: string,
  serviceName: ServiceName,
  options?: { url?: string }
) {
  const serviceConfig = getServiceConfig(serviceName);
  const protoConfig = getProtoLoaderConfig(serviceConfig.protoFile);
  const url = options?.url || getServiceUrl(serviceName);
  
  return {
    name: clientName,
    transport: 4, // Transport.GRPC = 4
    options: {
      package: serviceConfig.package,
      protoPath: protoConfig.protoPath,
      url,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: protoConfig.includeDirs,
      },
    },
  };
}
