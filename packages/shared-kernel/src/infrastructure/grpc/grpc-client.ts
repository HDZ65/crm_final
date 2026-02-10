/**
 * gRPC Client Factory
 *
 * Utilities for creating gRPC clients with proper proto loading
 */

import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync, Options as ProtoLoaderOptions } from '@grpc/proto-loader';
import { getProtoLoaderConfig } from './proto-loader.js';
import { getServiceConfig, getServiceUrl } from './service-config.js';
import type { ServiceName } from './service-config.js';

export interface GrpcClientOptions {
  /** Service URL override (defaults to service registry URL) */
  url?: string;
  /** Additional proto loader options */
  loaderOptions?: Partial<ProtoLoaderOptions>;
}

/**
 * Load a gRPC package definition
 */
export function loadGrpcPackage(
  serviceName: ServiceName,
  options?: Pick<GrpcClientOptions, 'loaderOptions'>
): any {
  const serviceConfig = getServiceConfig(serviceName);
  const protoConfig = getProtoLoaderConfig(serviceConfig.protoFile);

  const packageDef = loadSync(protoConfig.protoPath, {
    keepCase: true,
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
 * NestJS-compatible gRPC client module options
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
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: protoConfig.includeDirs,
      },
    },
  };
}
