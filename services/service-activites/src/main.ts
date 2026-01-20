import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'activites',
      protoPath: join(__dirname, '../proto/activites.proto'),
      url: process.env.GRPC_URL || `0.0.0.0:${process.env.GRPC_PORT || '50051'}`,
    },
  });

  await app.listen();
  console.log(`Service Activites gRPC is running on port ${process.env.GRPC_PORT || '50051'}`);
}
bootstrap();
