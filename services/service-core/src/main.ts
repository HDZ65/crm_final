import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';
import { AppModule } from './app.module';

/**
 * Service Core - Consolidated Core Service
 * 
 * Merges three services: identity, clients, documents
 * Exposes gRPC endpoints for all three proto packages on dedicated ports.
 */
async function bootstrap() {
  // Create a hybrid application (HTTP + multiple gRPC services)
  const app = await NestFactory.create(AppModule);

  // ============================================================================
  // IDENTITY gRPC SERVICE (port 50052 - original identity port)
  // ============================================================================
  const identityOptions = getGrpcOptions('identity', { 
    url: `0.0.0.0:${process.env.IDENTITY_GRPC_PORT || 50052}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: identityOptions,
  });
  console.log(`gRPC Identity configured on ${identityOptions.url}`);

  // ============================================================================
  // CLIENTS gRPC SERVICE (port 50056 - original clients port)
  // ============================================================================
  const clientsOptions = getGrpcOptions('clients', { 
    url: `0.0.0.0:${process.env.CLIENTS_GRPC_PORT || 50056}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: clientsOptions,
  });
  console.log(`gRPC Clients configured on ${clientsOptions.url}`);

  // ============================================================================
  // DOCUMENTS gRPC SERVICE (port 50057 - original documents port)
  // ============================================================================
  const documentsOptions = getGrpcOptions('documents', { 
    url: `0.0.0.0:${process.env.DOCUMENTS_GRPC_PORT || 50057}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: documentsOptions,
  });
  console.log(`gRPC Documents configured on ${documentsOptions.url}`);

  // ============================================================================
  // HTTP Server (for webhooks and health checks)
  // ============================================================================
  const httpPort = process.env.HTTP_PORT || 3052;

  // Start all microservices and HTTP server
  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-CORE STARTED (Consolidated)');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC Identity: ${identityOptions.url}`);
  console.log(`gRPC Clients: ${clientsOptions.url}`);
  console.log(`gRPC Documents: ${documentsOptions.url}`);
  console.log('========================================');
}

bootstrap();
