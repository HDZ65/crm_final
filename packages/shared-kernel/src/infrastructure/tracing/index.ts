export {
  initializeOpenTelemetry,
  shutdownOpenTelemetry,
  getOpenTelemetrySDK,
  type OpenTelemetryConfig,
} from './opentelemetry.config.js';

export {
  getTracer,
  createSpan,
  withSpan,
  extractTraceContextFromMetadata,
  injectTraceContextIntoMetadata,
  createGrpcClientSpan,
  createGrpcServerSpan,
  createNatsPublishSpan,
  createNatsSubscribeSpan,
  recordSpanError,
  getCurrentTraceId,
  getCurrentSpanId,
} from './tracing.utils.js';
