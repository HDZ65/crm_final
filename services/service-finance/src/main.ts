import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getMultiGrpcOptions } from '@crm/shared-kernel';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const grpcPort = process.env.GRPC_PORT || 50059;
  const grpcOptions = getMultiGrpcOptions(['factures', 'payments', 'calendar'], {
    url: `0.0.0.0:${grpcPort}`,
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT || 3059;
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-FINANCE STARTED');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC [factures, payments, calendar]: 0.0.0.0:${grpcPort}`);
  console.log('========================================');
}

bootstrap();
