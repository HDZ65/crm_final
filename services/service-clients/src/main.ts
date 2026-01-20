import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'clients',
      protoPath: join(__dirname, '../../proto/clients.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50061}`,
    },
  });

  await app.listen();
  console.log('Service Clients gRPC is listening on port', process.env.GRPC_PORT || 50061);
}

bootstrap();
