import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || '50063';
  const grpcUrl = process.env.GRPC_URL || `0.0.0.0:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: join(process.cwd(), 'proto/payment.proto'),
      url: grpcUrl,
      maxReceiveMessageLength: 20 * 1024 * 1024, // 20MB for large payloads
      maxSendMessageLength: 20 * 1024 * 1024,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  // Startup banner
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_DATABASE || 'payments_db';

  console.log(`
╔══════════════════════════════════════════════════════╗
║        💳 Service Payments - gRPC Microservice       ║
╠══════════════════════════════════════════════════════╣
║   gRPC URL:    ${grpcUrl.padEnd(38)} ║
║   Database:    ${`${dbHost}:${dbPort}/${dbName}`.padEnd(38)} ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(38)} ║
╠══════════════════════════════════════════════════════╣
║   Payment Providers:                                 ║
║   - Stripe (Cards, Subscriptions)                    ║
║   - PayPal (Orders, Capture)                         ║
║   - GoCardless (SEPA, ACH Direct Debit)              ║
╠══════════════════════════════════════════════════════╣
║   gRPC Services:                                     ║
║   - PaymentService.CreateStripeCheckoutSession       ║
║   - PaymentService.CreateStripePaymentIntent         ║
║   - PaymentService.CreatePayPalOrder                 ║
║   - PaymentService.CapturePayPalOrder                ║
║   - PaymentService.GetPSPAccountsSummary             ║
╚══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
