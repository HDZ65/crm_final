import 'reflect-metadata';
import { getMultiGrpcOptions } from '@crm/shared-kernel';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const grpcPort = process.env.GRPC_PORT || 50060;
  const grpcOptions = getMultiGrpcOptions(['qualite'], {
    url: `0.0.0.0:${grpcPort}`,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT || 3410;
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-QUALITE STARTED');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC [qualite]: 0.0.0.0:${grpcPort}`);
  console.log('========================================');
}

bootstrap();
