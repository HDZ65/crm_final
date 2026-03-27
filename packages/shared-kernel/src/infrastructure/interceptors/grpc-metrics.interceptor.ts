import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * Metrics bucket for histogram
 */
const LATENCY_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * In-memory metrics store
 * In production, replace with Prometheus client or similar
 */
class MetricsStore {
  private static instance: MetricsStore;
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  static getInstance(): MetricsStore {
    if (!MetricsStore.instance) {
      MetricsStore.instance = new MetricsStore();
    }
    return MetricsStore.instance;
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  getMetrics(): GrpcMetrics {
    const result: GrpcMetrics = {
      requests: {},
      latency: {},
      errors: {},
    };

    this.counters.forEach((value, key) => {
      if (key.startsWith('grpc_requests_total')) {
        result.requests[key] = value;
      } else if (key.startsWith('grpc_errors_total')) {
        result.errors[key] = value;
      }
    });

    this.histograms.forEach((values, key) => {
      if (key.startsWith('grpc_request_duration')) {
        result.latency[key] = this.calculateHistogramStats(values);
      }
    });

    return result;
  }

  private buildKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  private calculateHistogramStats(values: number[]): HistogramStats {
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

interface HistogramStats {
  count: number;
  sum: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface GrpcMetrics {
  requests: Record<string, number>;
  latency: Record<string, HistogramStats>;
  errors: Record<string, number>;
}

/**
 * gRPC Metrics Interceptor
 *
 * Collects metrics for all gRPC calls:
 * - Request count per method
 * - Latency distribution
 * - Error count per method and code
 */
@Injectable()
export class GrpcMetricsInterceptor implements NestInterceptor {
  private readonly metrics = MetricsStore.getInstance();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const { service, method } = this.extractMethodInfo(context);

    // Increment request counter
    this.metrics.incrementCounter('grpc_requests_total', {
      service,
      method,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          // Record latency
          this.metrics.recordHistogram('grpc_request_duration_ms', duration, {
            service,
            method,
            status: 'success',
          });

          // Record success counter
          this.metrics.incrementCounter('grpc_requests_total', {
            service,
            method,
            status: 'success',
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const errorCode = String(error.code || 'unknown');

          // Record latency even on error
          this.metrics.recordHistogram('grpc_request_duration_ms', duration, {
            service,
            method,
            status: 'error',
          });

          // Record error counter
          this.metrics.incrementCounter('grpc_errors_total', {
            service,
            method,
            code: errorCode,
          });
        },
      }),
    );
  }

  private extractMethodInfo(context: ExecutionContext): { service: string; method: string } {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    // Extract service name from controller (e.g., "ContratController" -> "contrat")
    const service = className.replace(/Controller$/i, '').toLowerCase();

    return { service, method: handlerName };
  }

  /**
   * Get current metrics (for /metrics endpoint)
   */
  static getMetrics(): GrpcMetrics {
    return MetricsStore.getInstance().getMetrics();
  }

  /**
   * Reset metrics (for testing)
   */
  static resetMetrics(): void {
    MetricsStore.getInstance().reset();
  }
}

export type { GrpcMetrics, HistogramStats };
