/**
 * Proto file loader with environment-aware path resolution
 *
 * Handles different environments:
 * - Development: proto files in packages/proto/src/
 * - Docker/Production: proto files copied to /app/proto/
 * - Tests: mock paths or local paths
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { getServiceConfig, getServiceUrl } from './service-config.js';
import type { ServiceName } from './service-config.js';

function resolvePackagePath(packageName: string): string | null {
  try {
    // Works in CJS context
    return require.resolve(packageName);
  } catch {
    return null;
  }
}

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
    const protoPackagePath = resolvePackagePath('@crm/proto/package.json')!;
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
 * import { getGrpcOptions } from '@crm/shared-kernel';
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
  const config = getServiceConfig(serviceName as ServiceName);
  const protoConfig = getProtoLoaderConfig(config.protoFile);

  const url = options?.url || getServiceUrl(serviceName as ServiceName);
  const maxSize = options?.maxMessageSize || 20 * 1024 * 1024; // 20MB default

  return {
    package: config.package,
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
    maxReceiveMessageLength: maxSize,
    maxSendMessageLength: maxSize,
  };
}

/**
 * Get NestJS gRPC options for multiple proto services on a single port
 */
export function getMultiGrpcOptions(serviceNames: string[], options?: {
  url?: string;
  maxMessageSize?: number;
}): {
  package: string[];
  protoPath: string[];
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
  const packageSet = new Set<string>();
  const protoPathSet = new Set<string>();

  for (const name of serviceNames) {
    const config = getServiceConfig(name as ServiceName);
    packageSet.add(config.package);
    protoPathSet.add(resolveProtoPath(config.protoFile));
  }

  const packages = Array.from(packageSet);
  const protoPaths = Array.from(protoPathSet);

  const url = options?.url || getServiceUrl(serviceNames[0] as ServiceName);
  const maxSize = options?.maxMessageSize || 20 * 1024 * 1024;

  return {
    package: packages,
    protoPath: protoPaths,
    url,
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: getProtoIncludeDirs(),
    },
    maxReceiveMessageLength: maxSize,
    maxSendMessageLength: maxSize,
  };
}
