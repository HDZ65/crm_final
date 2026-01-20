import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'organisations',
      protoPath: join(__dirname, '../proto/organisations.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50064}`,
    },
  });

  await app.listen();
  console.log('Service Organisations gRPC is listening on port', process.env.GRPC_PORT || 50064);
}

bootstrap();
