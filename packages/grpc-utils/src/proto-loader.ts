/**
 * Proto file loader with environment-aware path resolution
 * 
 * Handles different environments:
 * - Development: proto files in packages/proto/src/
 * - Docker/Production: proto files copied to /app/proto/
 * - Tests: mock paths or local paths
 */

import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

export interface ProtoPathOptions {
  /** Proto file path relative to proto/src/ (e.g., 'clients/clients.proto') */
  protoFile: string;
  /** Additional include directories for proto imports */
  includeDirs?: string[];
}

/**
 * Environment detection
 */
export function isDocker(): boolean {
  return existsSync('/.dockerenv') || process.env.DOCKER === 'true';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the base proto directory based on environment
 */
export function getProtoBaseDir(): string {
  // Docker/Production: protos are copied to /app/proto
  if (isDocker() || isProduction()) {
    const dockerPath = '/app/proto';
    if (existsSync(dockerPath)) {
      return dockerPath;
    }
  }

  // Development: find the packages/proto/src directory
  // Try to resolve from @crm/proto package
  try {
    const protoPackagePath = require.resolve('@crm/proto/package.json');
    const protoSrcDir = join(dirname(protoPackagePath), 'src');
    if (existsSync(protoSrcDir)) {
      return protoSrcDir;
    }
  } catch {
    // Package not installed, try relative paths
  }

  // Fallback: try common relative paths from cwd
  const fallbackPaths = [
    join(process.cwd(), 'packages/proto/src'),
    join(process.cwd(), '../packages/proto/src'),
    join(process.cwd(), '../../packages/proto/src'),
  ];

  for (const fallback of fallbackPaths) {
    if (existsSync(fallback)) {
      return fallback;
    }
  }

  throw new Error(
    'Could not find proto source directory. ' +
    'Ensure @crm/proto is installed or proto files exist in packages/proto/src/'
  );
}

/**
 * Resolve the full path to a proto file
 * 
 * @param protoFile - Proto file path relative to proto/src/ (e.g., 'clients/clients.proto')
 * @returns Absolute path to the proto file
 * 
 * @example
 * ```typescript
 * const path = resolveProtoPath('clients/clients.proto');
 * // Returns: /app/proto/clients/clients.proto (Docker)
 * // Or: /path/to/project/packages/proto/src/clients/clients.proto (Dev)
 * ```
 */
export function resolveProtoPath(protoFile: string): string {
  const baseDir = getProtoBaseDir();
  const fullPath = join(baseDir, protoFile);
  
  if (!existsSync(fullPath)) {
    throw new Error(
      `Proto file not found: ${fullPath}\n` +
      `Base directory: ${baseDir}\n` +
      `Proto file: ${protoFile}`
    );
  }
  
  return fullPath;
}

/**
 * Resolve multiple proto file paths
 */
export function resolveProtoPaths(protoFiles: string[]): string[] {
  return protoFiles.map(resolveProtoPath);
}

/**
 * Get include directories for proto imports
 */
export function getProtoIncludeDirs(): string[] {
  const baseDir = getProtoBaseDir();
  return [baseDir, dirname(baseDir)];
}

/**
 * Get gRPC proto loader options with resolved paths
 * 
 * @example
 * ```typescript
 * const { protoPath, includeDirs } = getProtoLoaderConfig('clients/clients.proto');
 * 
 * const packageDef = loadSync(protoPath, {
 *   keepCase: false,
 *   longs: String,
 *   enums: String,
 *   defaults: true,
 *   oneofs: true,
 *   includeDirs,
 * });
 * ```
 */
export function getProtoLoaderConfig(protoFile: string): {
  protoPath: string;
  includeDirs: string[];
} {
  return {
    protoPath: resolveProtoPath(protoFile),
    includeDirs: getProtoIncludeDirs(),
  };
}

/**
 * Get NestJS gRPC microservice options
 * 
 * @example
 * ```typescript
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
 */
export function getGrpcOptions(serviceName: string, options?: {
  url?: string;
  maxMessageSize?: number;
}): {
  package: string;
  protoPath: string;
  url: string;
  loader: {
    keepCase: boolean;
    longs: StringConstructor;
    enums: StringConstructor;
    defaults: boolean;
    oneofs: boolean;
    includeDirs: string[];
  };
  maxReceiveMessageLength?: number;
  maxSendMessageLength?: number;
} {
  // Import service config (avoiding circular dependency by lazy import)
  const { getServiceConfig, getServiceUrl } = require('./service-config');
  const config = getServiceConfig(serviceName);
  const protoConfig = getProtoLoaderConfig(config.protoFile);
  
  const url = options?.url || getServiceUrl(serviceName);
  const maxSize = options?.maxMessageSize || 20 * 1024 * 1024; // 20MB default
  
  return {
    package: config.package,
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
    maxReceiveMessageLength: maxSize,
    maxSendMessageLength: maxSize,
  };
}
