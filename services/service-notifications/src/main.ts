import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('NotificationsMicroservice');

  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50055';
  const grpcUrl = `${grpcHost}:${grpcPort}`;
  const wsPort = parseInt(process.env.WS_PORT || '3055', 10);

  // Create a hybrid application (HTTP + gRPC)
  // HTTP is needed for WebSocket support
  const app = await NestFactory.create(AppModule);

  // Enable CORS for WebSocket
  app.enableCors({
    origin: process.env.WS_CORS_ORIGIN || '*',
    credentials: true,
  });

  // Connect gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'notifications',
      protoPath: join(process.cwd(), 'proto/notifications.proto'),
      url: grpcUrl,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  // Start all microservices
  await app.startAllMicroservices();

  // Start HTTP server for WebSocket
  await app.listen(wsPort);

  logger.log(`Notifications gRPC service is running on ${grpcUrl}`);
  logger.log(`WebSocket server is running on port ${wsPort}`);
  logger.log('Notifications microservice started successfully');
}

bootstrap().catch((error) => {
  console.error('Failed to start Notifications microservice:', error);
  process.exit(1);
});
