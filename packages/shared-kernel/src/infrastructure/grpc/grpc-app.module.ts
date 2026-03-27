import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcLoggingInterceptor } from '../interceptors/grpc-logging.interceptor';
import { GrpcAuthInterceptor } from '../interceptors/grpc-auth.interceptor';
import { GrpcDeadlineInterceptor } from '../interceptors/grpc-deadline.interceptor';
import { GrpcMetricsInterceptor } from '../interceptors/grpc-metrics.interceptor';
import { GrpcExceptionFilter } from '../filters/grpc-exception.filter';

/**
 * GrpcAppModule provides a standardized set of gRPC interceptors and filters
 * for all backend services. This eliminates boilerplate code duplication
 * across services.
 *
 * Interceptor execution order (request flow):
 * 1. GrpcLoggingInterceptor - Logs incoming requests
 * 2. GrpcAuthInterceptor - Extracts and validates user context from metadata
 * 3. GrpcDeadlineInterceptor - Enforces request deadlines
 * 4. GrpcMetricsInterceptor - Records performance metrics
 *
 * The GrpcExceptionFilter catches and transforms exceptions to proper gRPC status codes.
 *
 * @example
 * // In your service's app.module.ts:
 * import { GrpcAppModule } from '@crm/shared-kernel';
 *
 * @Module({
 *   imports: [
 *     GrpcAppModule.forRoot(),
 *     // ... other modules
 *   ],
 * })
 * export class AppModule {}
 */
@Module({})
export class GrpcAppModule {
  /**
   * Creates a dynamic module with all gRPC interceptors and filters configured.
   *
   * @param options - Optional configuration
   * @param options.disableAuth - Set to true to disable auth interceptor (for internal services)
   * @param options.disableMetrics - Set to true to disable metrics interceptor
   * @returns A configured DynamicModule
   */
  static forRoot(options?: { disableAuth?: boolean; disableMetrics?: boolean }): DynamicModule {
    const providers: Provider[] = [
      // Logging interceptor (always enabled, runs first)
      {
        provide: APP_INTERCEPTOR,
        useClass: GrpcLoggingInterceptor,
      },
    ];

    // Auth interceptor (can be disabled for internal services)
    if (!options?.disableAuth) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: GrpcAuthInterceptor,
      });
    }

    // Deadline interceptor (always enabled)
    providers.push({
      provide: APP_INTERCEPTOR,
      useClass: GrpcDeadlineInterceptor,
    });

    // Metrics interceptor (can be disabled)
    if (!options?.disableMetrics) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: GrpcMetricsInterceptor,
      });
    }

    // Exception filter (always enabled)
    providers.push({
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    });

    return {
      module: GrpcAppModule,
      providers,
      exports: [],
      global: true,
    };
  }
}
