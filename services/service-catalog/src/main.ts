import 'reflect-metadata';
import { getMultiGrpcOptions } from '@crm/shared-kernel';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const grpcPort = process.env.GRPC_PORT || 50058;
  const grpcOptions = getMultiGrpcOptions(
    [
      'products',
      'subscriptions',
      'subscription-plans',
      'subscription-preferences',
      'subscription-preference-schemas',
      'bundle',
    ],
    {
      url: `0.0.0.0:${grpcPort}`,
    },
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT || 3408;
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-CATALOG STARTED');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC [products, subscriptions, subscription-plans, bundle]: 0.0.0.0:${grpcPort}`);
  console.log('========================================');
}

bootstrap();
