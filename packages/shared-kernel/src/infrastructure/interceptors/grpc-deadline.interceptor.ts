import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, race, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { Metadata } from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RequestContextStorage, type GrpcDeadlineContext as DeadlineCtx } from '../context/request-context';

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Minimum timeout to prevent too aggressive timeouts
 */
const MIN_TIMEOUT_MS = 100;

/**
 * gRPC Deadline Interceptor
 *
 * Handles gRPC deadline propagation:
 * - Extracts deadline from incoming metadata
 * - Enforces timeout on handler execution
 * - Propagates remaining deadline to downstream calls via AsyncLocalStorage
 *
 * IMPORTANT: Uses AsyncLocalStorage for thread-safe deadline context.
 * NEVER use global variables for request-scoped data.
 */
@Injectable()
export class GrpcDeadlineInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcDeadlineInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const deadline = this.extractDeadline(context);
    const remainingMs = this.calculateRemainingTime(deadline);

    if (remainingMs !== null && remainingMs <= 0) {
      // Deadline already exceeded
      this.logger.warn('Deadline already exceeded before processing');
      return throwError(
        () =>
          new RpcException({
            code: GrpcStatus.DEADLINE_EXCEEDED,
            message: 'Deadline exceeded before processing could begin',
          }),
      );
    }

    const timeoutMs = remainingMs ?? DEFAULT_TIMEOUT_MS;

    // Create deadline context
    const deadlineContext: DeadlineCtx = {
      deadline,
      timeoutMs,
      startTime: Date.now(),
    };

    // Execute handler within AsyncLocalStorage context with deadline
    return new Observable((subscriber) => {
      const currentContext = RequestContextStorage.getContext() || {};

      RequestContextStorage.run(
        {
          ...currentContext,
          deadline: deadlineContext,
        },
        () => {
          // Race between handler and timeout
          race(
            next.handle(),
            timer(timeoutMs).pipe(
              map(() => {
                throw new RpcException({
                  code: GrpcStatus.DEADLINE_EXCEEDED,
                  message: `Request exceeded deadline of ${timeoutMs}ms`,
                });
              }),
            ),
          ).subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }

  /**
   * Extract deadline from gRPC metadata
   */
  private extractDeadline(context: ExecutionContext): Date | null {
    try {
      const metadata: Metadata = context.getArgByIndex(1);

      if (metadata && typeof metadata.get === 'function') {
        // Check for grpc-timeout header (format: "30S", "500m", etc.)
        const timeoutHeader = metadata.get('grpc-timeout')?.[0]?.toString();
        if (timeoutHeader) {
          return this.parseGrpcTimeout(timeoutHeader);
        }

        // Check for explicit deadline header
        const deadlineHeader = metadata.get('deadline')?.[0]?.toString();
        if (deadlineHeader) {
          const deadlineTs = parseInt(deadlineHeader, 10);
          if (!isNaN(deadlineTs)) {
            return new Date(deadlineTs);
          }
        }
      }
    } catch (error) {
      this.logger.debug(`Could not extract deadline from metadata: ${error}`);
    }

    return null;
  }

  /**
   * Parse gRPC timeout format
   * Format: <value><unit> where unit is H (hours), M (minutes), S (seconds),
   * m (milliseconds), u (microseconds), n (nanoseconds)
   */
  private parseGrpcTimeout(timeout: string): Date | null {
    const match = timeout.match(/^(\d+)([HMSmun])$/);
    if (!match || !match[1] || !match[2]) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    let ms: number;
    switch (unit) {
      case 'H':
        ms = value * 60 * 60 * 1000;
        break;
      case 'M':
        ms = value * 60 * 1000;
        break;
      case 'S':
        ms = value * 1000;
        break;
      case 'm':
        ms = value;
        break;
      case 'u':
        ms = value / 1000;
        break;
      case 'n':
        ms = value / 1000000;
        break;
      default:
        return null;
    }

    return new Date(Date.now() + ms);
  }

  /**
   * Calculate remaining time until deadline
   */
  private calculateRemainingTime(deadline: Date | null): number | null {
    if (!deadline) return null;

    const remaining = deadline.getTime() - Date.now();
    return Math.max(remaining, MIN_TIMEOUT_MS);
  }
}

/**
 * Helper class to access and propagate deadline context
 * Uses AsyncLocalStorage - safe for concurrent requests
 */
export class GrpcDeadlineContextHelper {
  /**
   * Get remaining timeout for downstream calls
   */
  static getRemainingTimeout(): number {
    return RequestContextStorage.getRemainingTimeout(DEFAULT_TIMEOUT_MS, 100);
  }

  /**
   * Get deadline as timestamp for metadata
   */
  static getDeadlineTimestamp(): number | null {
    const deadline = RequestContextStorage.getDeadline();
    if (!deadline?.deadline) return null;
    return deadline.deadline.getTime();
  }

  /**
   * Create metadata with propagated deadline
   */
  static createMetadataWithDeadline(existingMetadata?: Metadata): Metadata {
    const metadata = existingMetadata || new Metadata();
    const remaining = this.getRemainingTimeout();

    // Set grpc-timeout in milliseconds format
    metadata.set('grpc-timeout', `${remaining}m`);

    // Also set deadline timestamp for explicit propagation
    const deadline = this.getDeadlineTimestamp();
    if (deadline) {
      metadata.set('deadline', String(deadline));
    }

    return metadata;
  }
}

export { GrpcDeadlineContextHelper as DeadlineContextHelper };
