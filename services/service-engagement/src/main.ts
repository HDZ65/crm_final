import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getMultiGrpcOptions } from '@crm/shared-kernel';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const grpcPort = process.env.GRPC_PORT || 50051;
  const grpcOptions = getMultiGrpcOptions(['activites', 'notifications', 'email', 'agenda', 'wincash'], {
    url: `0.0.0.0:${grpcPort}`,
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT || 3061;
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-ENGAGEMENT STARTED');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC [activites, notifications, email, agenda, wincash]: 0.0.0.0:${grpcPort}`);
  console.log('========================================');
}

bootstrap();
