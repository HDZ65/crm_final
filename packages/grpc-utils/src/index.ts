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

// gRPC client utilities
export {
	createGrpcClient,
	createPromisifiedGrpcClient,
	type GrpcClientConfig,
	type GrpcClientOptions,
	getGrpcClientConfig,
	getGrpcClientModuleOptions,
	loadGrpcPackage,
} from "./grpc-client";

// Interceptors
export { AuthInterceptor } from "./interceptors/auth.interceptor";

// Proto loading utilities
export {
	getGrpcOptions,
	getProtoBaseDir,
	getProtoIncludeDirs,
	getProtoLoaderConfig,
	isDocker,
	isProduction,
	resolveProtoPath,
	resolveProtoPaths,
} from "./proto-loader";

// Service configuration
export {
	getServiceConfig,
	getServiceUrl,
	SERVICE_REGISTRY,
	type ServiceConfig,
	type ServiceName,
} from "./service-config";

// Health check utilities
export {
	HealthService,
	ServingStatus,
	type HealthCheckRequest,
	type HealthCheckResponse,
} from "./health/health.service";
export { HealthController } from "./health/health.controller";
