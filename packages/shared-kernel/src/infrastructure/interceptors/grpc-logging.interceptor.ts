import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

/**
 * gRPC Logging Interceptor
 *
 * Logs all gRPC method calls with:
 * - Method name and service
 * - Request metadata (correlation ID, user ID)
 * - Execution duration
 * - Response status (success/error)
 */
@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('gRPC');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();
    const metadata = this.extractMetadata(context);

    const methodName = this.getMethodName(context);
    const correlationId = metadata.correlationId || data?.correlation_id || this.generateCorrelationId();

    // Log request
    this.logger.log({
      type: 'grpc_request',
      method: methodName,
      correlationId,
      userId: metadata.userId,
      timestamp: new Date().toISOString(),
      // Don't log full request data in production (may contain sensitive info)
      requestSize: JSON.stringify(data || {}).length,
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          this.logger.log({
            type: 'grpc_response',
            method: methodName,
            correlationId,
            status: 'success',
            durationMs: duration,
            responseSize: JSON.stringify(response || {}).length,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            type: 'grpc_error',
            method: methodName,
            correlationId,
            status: 'error',
            durationMs: duration,
            errorCode: error.code,
            errorMessage: error.message,
          });
        },
      }),
    );
  }

  private getMethodName(context: ExecutionContext): string {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    return `${className}.${handlerName}`;
  }

  private extractMetadata(context: ExecutionContext): { correlationId?: string; userId?: string } {
    try {
      const metadata: Metadata = context.getArgByIndex(1);
      if (metadata && typeof metadata.get === 'function') {
        return {
          correlationId: metadata.get('x-correlation-id')?.[0]?.toString(),
          userId: metadata.get('x-user-id')?.[0]?.toString(),
        };
      }
    } catch {
      // Metadata not available
    }
    return {};
  }

  private generateCorrelationId(): string {
    return `grpc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
