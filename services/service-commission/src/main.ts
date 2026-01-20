import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CommissionMicroservice');

  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50056';
  const grpcUrl = `${grpcHost}:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'commission',
        protoPath: join(process.cwd(), 'proto/commission.proto'),
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
  logger.log(`Commission microservice is running on ${grpcUrl}`);
  logger.log('gRPC Commission Service started successfully');
}

bootstrap().catch((error) => {
  console.error('Failed to start Commission microservice:', error);
  process.exit(1);
});
