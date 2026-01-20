import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcUrl = process.env.GRPC_URL || '0.0.0.0:50059';

  // Créer le microservice gRPC
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'factures',
        protoPath: join(__dirname, '../proto/factures.proto'),
        url: grpcUrl,
        maxReceiveMessageLength: 20 * 1024 * 1024, // 20MB for base64 images
        maxSendMessageLength: 20 * 1024 * 1024,    // 20MB for PDF responses
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    },
  );

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen();

  console.log(`SERVICE FACTURES - gRPC started on ${grpcUrl}`);
}

bootstrap();
