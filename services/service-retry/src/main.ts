import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('RetryMicroservice');

  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50059';
  const grpcUrl = `${grpcHost}:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'retry',
        protoPath: [
          join(process.cwd(), 'proto/retry/am04_retry.proto'),
          join(process.cwd(), 'proto/retry/am04_retry_service.proto'),
        ],
        url: grpcUrl,
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

  await app.listen();
  logger.log(`Retry microservice is running on ${grpcUrl}`);
  logger.log('gRPC Retry Service started successfully');
  logger.log('Scheduler: Daily retry run at 10:00 Europe/Paris');
  logger.log('Scheduler: Reminder processing every 5 minutes');
}

bootstrap().catch((error) => {
  console.error('Failed to start Retry microservice:', error);
  process.exit(1);
});
