import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RequestContextStorage, type GrpcUserContext } from '../context/request-context';

/**
 * Key for storing user context in request data (legacy support)
 */
export const GRPC_USER_CONTEXT = Symbol('GRPC_USER_CONTEXT');

/**
 * gRPC Authentication Interceptor
 *
 * Extracts and validates authentication context from gRPC metadata:
 * - User ID and organization from JWT claims (propagated by gateway)
 * - Roles and permissions
 * - Correlation ID for tracing
 *
 * The gateway validates the JWT and passes claims via metadata.
 * This interceptor trusts the gateway (internal service-to-service auth).
 *
 * IMPORTANT: Uses AsyncLocalStorage for thread-safe request context isolation.
 * NEVER use global variables for request-scoped data.
 */
@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcAuthInterceptor.name);

  /**
   * List of methods that don't require authentication
   */
  private readonly publicMethods = new Set([
    'Health.Check',
    'Health.Watch',
    'ReadinessProbe.Check',
    'LivenessProbe.Check',
    'HealthController.check',
    'HealthController.watch',
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const methodName = this.getMethodName(context);

    // Skip auth for public methods
    if (this.isPublicMethod(methodName)) {
      return next.handle();
    }

    const metadata = this.extractMetadata(context);
    const userContext = this.extractUserContext(metadata);

    // Validate required fields
    if (!userContext.userId || !userContext.organisationId) {
      this.logger.warn(`Missing auth context for ${methodName}`);
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Authentication required',
      });
    }

    // Store user context in request data for handler access (legacy support)
    this.storeUserContextInData(context, userContext as GrpcUserContext);

    // Execute handler within AsyncLocalStorage context
    return new Observable((subscriber) => {
      const currentContext = RequestContextStorage.getContext() || {};

      RequestContextStorage.run(
        {
          ...currentContext,
          user: userContext as GrpcUserContext,
          traceId: userContext.correlationId,
        },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }

  private getMethodName(context: ExecutionContext): string {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    return `${className}.${handlerName}`;
  }

  private isPublicMethod(methodName: string): boolean {
    return this.publicMethods.has(methodName);
  }

  private extractMetadata(context: ExecutionContext): Metadata | null {
    try {
      return context.getArgByIndex(1) as Metadata;
    } catch {
      return null;
    }
  }

  private extractUserContext(metadata: Metadata | null): Partial<GrpcUserContext> {
    if (!metadata || typeof metadata.get !== 'function') {
      return {};
    }

    const getHeader = (key: string): string | undefined => {
      const value = metadata.get(key)?.[0];
      return value?.toString();
    };

    const getArrayHeader = (key: string): string[] => {
      const value = getHeader(key);
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((s) => s.trim());
      }
    };

    return {
      userId: getHeader('x-user-id'),
      email: getHeader('x-user-email'),
      organisationId: getHeader('x-organisation-id'),
      roles: getArrayHeader('x-user-roles'),
      permissions: getArrayHeader('x-user-permissions'),
      correlationId: getHeader('x-correlation-id') || this.generateCorrelationId(),
    };
  }

  private storeUserContextInData(context: ExecutionContext, userContext: GrpcUserContext): void {
    // Store in the RPC data for handler access (legacy support)
    const data = context.switchToRpc().getData();
    if (data && typeof data === 'object') {
      (data as Record<symbol, GrpcUserContext>)[GRPC_USER_CONTEXT] = userContext;
    }
  }

  private generateCorrelationId(): string {
    return `grpc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Helper to get current user context in services
 * Uses AsyncLocalStorage - safe for concurrent requests
 */
export function getCurrentUserContext(): GrpcUserContext | null {
  const user = RequestContextStorage.getUser();
  return user !== undefined ? user : null;
}

/**
 * Helper to get user context from request data (legacy)
 */
export function getUserContextFromData(data: unknown): GrpcUserContext | null {
  if (data && typeof data === 'object' && GRPC_USER_CONTEXT in data) {
    const context = (data as Record<symbol, GrpcUserContext>)[GRPC_USER_CONTEXT];
    return context ?? null;
  }
  return null;
}

/**
 * Create metadata with user context for downstream calls
 */
export function createAuthMetadata(userContext?: GrpcUserContext): Metadata {
  const metadata = new Metadata();
  const user = userContext ?? RequestContextStorage.getUser();

  if (!user) {
    return metadata;
  }

  metadata.set('x-user-id', user.userId);
  metadata.set('x-organisation-id', user.organisationId);
  metadata.set('x-correlation-id', user.correlationId);

  if (user.email) {
    metadata.set('x-user-email', user.email);
  }

  if (user.roles.length > 0) {
    metadata.set('x-user-roles', JSON.stringify(user.roles));
  }

  if (user.permissions.length > 0) {
    metadata.set('x-user-permissions', JSON.stringify(user.permissions));
  }

  return metadata;
}

// Re-export type for convenience
export type { GrpcUserContext };
