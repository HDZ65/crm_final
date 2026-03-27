import { AsyncLocalStorage } from 'async_hooks';

/**
 * User context extracted from gRPC metadata
 */
export interface GrpcUserContext {
  userId: string;
  email?: string;
  organisationId: string;
  roles: string[];
  permissions: string[];
  correlationId: string;
}

/**
 * Deadline context for gRPC timeout propagation
 */
export interface GrpcDeadlineContext {
  deadline: Date | null;
  timeoutMs: number;
  startTime: number;
}

/**
 * Complete request context stored in AsyncLocalStorage
 * This provides isolation between concurrent requests
 */
export interface RequestContext {
  user?: GrpcUserContext;
  deadline?: GrpcDeadlineContext;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, string>;
}

/**
 * AsyncLocalStorage instance for request-scoped context
 * This is the ONLY safe way to store request context in Node.js
 * DO NOT use global variables for request-scoped data
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Request context utilities
 */
export const RequestContextStorage = {
  /**
   * Get the current request context
   * Returns undefined if called outside of a request context
   */
  getContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
  },

  /**
   * Get user context from current request
   */
  getUser(): GrpcUserContext | undefined {
    return asyncLocalStorage.getStore()?.user;
  },

  /**
   * Get deadline context from current request
   */
  getDeadline(): GrpcDeadlineContext | undefined {
    return asyncLocalStorage.getStore()?.deadline;
  },

  /**
   * Get correlation/trace ID from current request
   */
  getTraceId(): string | undefined {
    return asyncLocalStorage.getStore()?.traceId;
  },

  /**
   * Run a function within a request context
   * All code executed within the callback will have access to the context
   */
  run<T>(context: RequestContext, fn: () => T): T {
    return asyncLocalStorage.run(context, fn);
  },

  /**
   * Run an async function within a request context
   */
  runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return asyncLocalStorage.run(context, fn);
  },

  /**
   * Update the current context (merge with existing)
   * Only works within an existing context
   */
  updateContext(updates: Partial<RequestContext>): void {
    const current = asyncLocalStorage.getStore();
    if (current) {
      Object.assign(current, updates);
    }
  },

  /**
   * Set user in current context
   */
  setUser(user: GrpcUserContext): void {
    const current = asyncLocalStorage.getStore();
    if (current) {
      current.user = user;
    }
  },

  /**
   * Set deadline in current context
   */
  setDeadline(deadline: GrpcDeadlineContext): void {
    const current = asyncLocalStorage.getStore();
    if (current) {
      current.deadline = deadline;
    }
  },

  /**
   * Get remaining timeout for downstream calls
   * Calculates time remaining based on original deadline
   */
  getRemainingTimeout(defaultMs = 30000, bufferMs = 100): number {
    const deadline = asyncLocalStorage.getStore()?.deadline;
    if (!deadline) return defaultMs;

    const elapsed = Date.now() - deadline.startTime;
    const remaining = deadline.timeoutMs - elapsed - bufferMs;

    return Math.max(remaining, 100); // Minimum 100ms
  },

  /**
   * Check if the current request has a valid user context
   */
  isAuthenticated(): boolean {
    const user = asyncLocalStorage.getStore()?.user;
    return !!(user?.userId && user?.organisationId);
  },

  /**
   * Get the raw AsyncLocalStorage instance
   * Use with caution - prefer the helper methods above
   */
  getStorage(): AsyncLocalStorage<RequestContext> {
    return asyncLocalStorage;
  },
};

/**
 * Decorator to ensure a method runs within a request context
 * Useful for service methods that need context
 */
export function RequiresContext() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const context = RequestContextStorage.getContext();
      if (!context) {
        throw new Error(`Method ${propertyKey} requires a request context`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to ensure user is authenticated
 */
export function RequiresAuth() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      if (!RequestContextStorage.isAuthenticated()) {
        throw new Error(`Method ${propertyKey} requires authentication`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
