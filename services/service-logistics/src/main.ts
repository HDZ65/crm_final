import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50053';
  const grpcUrl = `${grpcHost}:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'logistics',
        protoPath: join(process.cwd(), 'proto/logistics.proto'),
        url: grpcUrl,
        maxReceiveMessageLength: 20 * 1024 * 1024,
        maxSendMessageLength: 20 * 1024 * 1024,
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
  console.log(`Logistics gRPC Microservice is running on ${grpcUrl}`);
}

bootstrap();
