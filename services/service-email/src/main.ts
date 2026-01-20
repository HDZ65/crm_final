import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('EmailMicroservice');

  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50054';
  const grpcUrl = `${grpcHost}:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'email',
        protoPath: join(process.cwd(), 'proto/email.proto'),
        url: grpcUrl,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
        maxReceiveMessageLength: 50 * 1024 * 1024, // 50MB for attachments
        maxSendMessageLength: 50 * 1024 * 1024,
      },
    },
  );

  await app.listen();
  logger.log(`Email microservice is running on ${grpcUrl}`);
  logger.log('gRPC Email Service started successfully');
}

bootstrap().catch((error) => {
  console.error('Failed to start Email microservice:', error);
  process.exit(1);
});
