import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

/**
 * OpenTelemetry configuration options
 */
export interface OpenTelemetryConfig {
  /** Service name for tracing */
  serviceName: string;

  /** Service version */
  serviceVersion?: string;

  /** OTLP endpoint for traces (e.g., 'http://jaeger:4317') */
  otlpEndpoint?: string;

  /** Enable console logging for debugging */
  debug?: boolean;

  /** Environment (development, staging, production) */
  environment?: string;

  /** Custom resource attributes */
  resourceAttributes?: Record<string, string>;

  /** Sampling ratio (0.0 to 1.0) */
  samplingRatio?: number;

  /** Export interval in milliseconds */
  exportIntervalMs?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<OpenTelemetryConfig> = {
  serviceVersion: '1.0.0',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  debug: process.env.OTEL_DEBUG === 'true',
  environment: process.env.NODE_ENV || 'development',
  samplingRatio: 1.0,
  exportIntervalMs: 10000,
};

/**
 * OpenTelemetry SDK instance
 */
let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry with the given configuration
 *
 * @example
 * ```typescript
 * // In main.ts, before NestFactory.create()
 * import { initializeOpenTelemetry } from '@crm/shared-kernel';
 *
 * initializeOpenTelemetry({
 *   serviceName: 'service-commercial',
 *   serviceVersion: '1.0.0',
 * });
 * ```
 */
export function initializeOpenTelemetry(config: OpenTelemetryConfig): void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Enable debug logging if requested
  if (mergedConfig.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  // Build resource with service information
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: mergedConfig.serviceName,
    [ATTR_SERVICE_VERSION]: mergedConfig.serviceVersion!,
    'deployment.environment': mergedConfig.environment!,
    ...mergedConfig.resourceAttributes,
  });

  // Configure trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: mergedConfig.otlpEndpoint,
  });

  // Configure metrics exporter
  const metricExporter = new OTLPMetricExporter({
    url: mergedConfig.otlpEndpoint,
  });

  // Create SDK
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: mergedConfig.exportIntervalMs,
    }),
    spanProcessor: new BatchSpanProcessor(traceExporter),
    textMapPropagator: new W3CTraceContextPropagator(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Customize instrumentations
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation (too noisy)
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (req) => {
            const ignoredPaths = ['/health', '/ready', '/live', '/metrics'];
            return ignoredPaths.some((path) => req.url?.startsWith(path));
          },
        },
        '@opentelemetry/instrumentation-grpc': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-redis': {
          enabled: true,
        },
      }),
    ],
  });

  // Start SDK
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });

  console.log(`OpenTelemetry initialized for ${mergedConfig.serviceName}`);
}

/**
 * Shutdown OpenTelemetry SDK gracefully
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Get the current OpenTelemetry SDK instance
 */
export function getOpenTelemetrySDK(): NodeSDK | null {
  return sdk;
}
