import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';
import { AppModule } from './app.module';

/**
 * Service Commercial - Consolidated Commercial Service
 * 
 * Merges three services: commerciaux, contrats, products
 * Exposes gRPC endpoints for all three proto packages on dedicated ports.
 */
async function bootstrap() {
  // Create a hybrid application (HTTP + multiple gRPC services)
  const app = await NestFactory.create(AppModule);

  // ============================================================================
  // COMMERCIAUX gRPC SERVICE (port 50053 - original commerciaux port)
  // ============================================================================
  const commerciauxOptions = getGrpcOptions('commerciaux', { 
    url: `0.0.0.0:${process.env.COMMERCIAUX_GRPC_PORT || 50053}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: commerciauxOptions,
  });
  console.log(`gRPC Commerciaux configured on ${commerciauxOptions.url}`);

  // ============================================================================
  // CONTRATS gRPC SERVICE (port 50055 - original contrats port)
  // ============================================================================
  const contratsOptions = getGrpcOptions('contrats', { 
    url: `0.0.0.0:${process.env.CONTRATS_GRPC_PORT || 50055}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: contratsOptions,
  });
  console.log(`gRPC Contrats configured on ${contratsOptions.url}`);

  // ============================================================================
  // PRODUCTS gRPC SERVICE (port 50064 - original products port)
  // ============================================================================
  const productsOptions = getGrpcOptions('products', { 
    url: `0.0.0.0:${process.env.PRODUCTS_GRPC_PORT || 50064}` 
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: productsOptions,
  });
  console.log(`gRPC Products configured on ${productsOptions.url}`);

  // ============================================================================
  // HTTP Server (for webhooks and health checks)
  // ============================================================================
  const httpPort = process.env.HTTP_PORT || 3053;

  // Start all microservices and HTTP server
  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-COMMERCIAL STARTED (Consolidated)');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC Commerciaux: ${commerciauxOptions.url}`);
  console.log(`gRPC Contrats: ${contratsOptions.url}`);
  console.log(`gRPC Products: ${productsOptions.url}`);
  console.log('========================================');
}

bootstrap();
