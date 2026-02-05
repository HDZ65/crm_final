import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';
import { AppModule } from './app.module';

/**
 * Service Finance - Consolidated Financial Service
 * 
 * Merges three services: factures, payments, calendar
 * Exposes gRPC endpoints for all three proto packages on dedicated ports.
 */
async function bootstrap() {
  // Create a hybrid application (HTTP for PortalController + multiple gRPC services)
  const app = await NestFactory.create(AppModule);

  // ============================================================================
  // FACTURES gRPC SERVICE (port 50059 - original factures port)
  // ============================================================================
  const facturesOptions = getGrpcOptions('factures', { 
    url: `0.0.0.0:${process.env.FACTURES_GRPC_PORT || 50059}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: facturesOptions,
  });
  console.log(`gRPC Factures configured on ${facturesOptions.url}`);

  // ============================================================================
  // PAYMENTS gRPC SERVICE (port 50063 - original payments port)
  // ============================================================================
  const paymentsOptions = getGrpcOptions('payments', { 
    url: `0.0.0.0:${process.env.PAYMENTS_GRPC_PORT || 50063}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: paymentsOptions,
  });
  console.log(`gRPC Payments configured on ${paymentsOptions.url}`);

  // ============================================================================
  // CALENDAR gRPC SERVICE (port 50068 - original calendar port)
  // ============================================================================
  const calendarOptions = getGrpcOptions('calendar', { 
    url: `0.0.0.0:${process.env.CALENDAR_GRPC_PORT || 50068}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: calendarOptions,
  });
  console.log(`gRPC Calendar configured on ${calendarOptions.url}`);

  // ============================================================================
  // HTTP Server (for Portal webhooks and health checks)
  // ============================================================================
  const httpPort = process.env.HTTP_PORT || 3059;

  // Start all microservices and HTTP server
  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-FINANCE STARTED (Consolidated)');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC Factures: ${facturesOptions.url}`);
  console.log(`gRPC Payments: ${paymentsOptions.url}`);
  console.log(`gRPC Calendar: ${calendarOptions.url}`);
  console.log('========================================');
}

bootstrap();
