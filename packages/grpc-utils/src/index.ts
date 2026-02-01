/**
 * @crm/grpc-utils
 * 
 * Centralized gRPC utilities for CRM microservices.
 * 
 * @example
 * ```typescript
 * // In a NestJS service main.ts
 * import { getGrpcOptions } from '@crm/grpc-utils';
 * 
 * const app = await NestFactory.createMicroservice<MicroserviceOptions>(
 *   AppModule,
 *   {
 *     transport: Transport.GRPC,
 *     options: getGrpcOptions('clients'),
 *   }
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // For custom gRPC clients
 * import { resolveProtoPath, getProtoIncludeDirs } from '@crm/grpc-utils';
 * 
 * const protoPath = resolveProtoPath('clients/clients.proto');
 * const includeDirs = getProtoIncludeDirs();
 * ```
 */

// Proto loading utilities
export {
  resolveProtoPath,
  resolveProtoPaths,
  getProtoBaseDir,
  getProtoIncludeDirs,
  getProtoLoaderConfig,
  getGrpcOptions,
  isDocker,
  isProduction,
} from './proto-loader';

// Service configuration
export {
  SERVICE_REGISTRY,
  getServiceConfig,
  getServiceUrl,
  type ServiceConfig,
  type ServiceName,
} from './service-config';

// gRPC client utilities
export {
  createGrpcClient,
  createPromisifiedGrpcClient,
  loadGrpcPackage,
  getGrpcClientConfig,
  getGrpcClientModuleOptions,
  type GrpcClientOptions,
  type GrpcClientConfig,
} from './grpc-client';
