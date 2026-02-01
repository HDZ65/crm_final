import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcOptions = getGrpcOptions('contrats');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.listen();
  console.log(`Service service-contrats gRPC listening on ${grpcOptions.url}`);
}

bootstrap();
