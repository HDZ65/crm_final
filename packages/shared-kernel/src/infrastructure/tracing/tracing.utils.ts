import { trace, context, SpanKind, SpanStatusCode, Span } from '@opentelemetry/api';
import { Metadata } from '@grpc/grpc-js';

/**
 * Get the default tracer for the application
 */
export function getTracer(name = 'crm-tracer') {
  return trace.getTracer(name);
}

/**
 * Create a new span for tracing
 *
 * @example
 * ```typescript
 * const span = createSpan('processPayment', { 'payment.amount': '100.00' });
 * try {
 *   await processPayment();
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.recordException(error);
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes,
  });
  return span;
}

/**
 * Execute a function within a traced span
 *
 * @example
 * ```typescript
 * const result = await withSpan('calculateCommission', async (span) => {
 *   span.setAttribute('commission.type', 'recurring');
 *   return await calculateCommission(data);
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes,
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Extract trace context from gRPC metadata
 */
export function extractTraceContextFromMetadata(metadata: Metadata): Record<string, string> {
  const ctx: Record<string, string> = {};

  const traceparent = metadata.get('traceparent')?.[0]?.toString();
  if (traceparent) {
    ctx['traceparent'] = traceparent;
  }

  const tracestate = metadata.get('tracestate')?.[0]?.toString();
  if (tracestate) {
    ctx['tracestate'] = tracestate;
  }

  return ctx;
}

/**
 * Inject trace context into gRPC metadata
 */
export function injectTraceContextIntoMetadata(metadata: Metadata): Metadata {
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    const spanContext = currentSpan.spanContext();

    // Build traceparent header
    const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
    metadata.set('traceparent', traceparent);
  }

  return metadata;
}

/**
 * Create a span for gRPC client calls
 */
export function createGrpcClientSpan(serviceName: string, methodName: string): Span {
  const tracer = getTracer();
  return tracer.startSpan(`grpc.client/${serviceName}/${methodName}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'rpc.system': 'grpc',
      'rpc.service': serviceName,
      'rpc.method': methodName,
    },
  });
}

/**
 * Create a span for gRPC server handlers
 */
export function createGrpcServerSpan(serviceName: string, methodName: string): Span {
  const tracer = getTracer();
  return tracer.startSpan(`grpc.server/${serviceName}/${methodName}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'rpc.system': 'grpc',
      'rpc.service': serviceName,
      'rpc.method': methodName,
    },
  });
}

/**
 * Create a span for NATS publish
 */
export function createNatsPublishSpan(subject: string): Span {
  const tracer = getTracer();
  return tracer.startSpan(`nats.publish/${subject}`, {
    kind: SpanKind.PRODUCER,
    attributes: {
      'messaging.system': 'nats',
      'messaging.destination': subject,
      'messaging.operation': 'publish',
    },
  });
}

/**
 * Create a span for NATS subscribe handler
 */
export function createNatsSubscribeSpan(subject: string): Span {
  const tracer = getTracer();
  return tracer.startSpan(`nats.subscribe/${subject}`, {
    kind: SpanKind.CONSUMER,
    attributes: {
      'messaging.system': 'nats',
      'messaging.destination': subject,
      'messaging.operation': 'process',
    },
  });
}

/**
 * Add error to current span
 */
export function recordSpanError(error: Error): void {
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.recordException(error);
    currentSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Get current trace ID for correlation
 */
export function getCurrentTraceId(): string | undefined {
  const currentSpan = trace.getSpan(context.active());
  return currentSpan?.spanContext().traceId;
}

/**
 * Get current span ID
 */
export function getCurrentSpanId(): string | undefined {
  const currentSpan = trace.getSpan(context.active());
  return currentSpan?.spanContext().spanId;
}
