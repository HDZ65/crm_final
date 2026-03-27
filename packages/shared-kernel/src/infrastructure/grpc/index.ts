// gRPC App Module (interceptors + filters bundle)
export { GrpcAppModule } from './grpc-app.module.js';

// gRPC client utilities
export {
  type GrpcClientOptions,
  getGrpcClientModuleOptions,
  loadGrpcPackage,
} from './grpc-client.js';

// Proto loading utilities
export {
  getGrpcOptions,
  getMultiGrpcOptions,
  getProtoBaseDir,
  getProtoIncludeDirs,
  getProtoLoaderConfig,
  isDocker,
  isProduction,
  type ProtoPathOptions,
  resolveProtoPath,
  resolveProtoPaths,
} from './proto-loader.js';

// Service configuration
export {
  getServiceConfig,
  getServiceUrl,
  SERVICE_REGISTRY,
  type ServiceConfig,
  type ServiceName,
} from './service-config.js';
