import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getMultiGrpcOptions } from '@crm/shared-kernel';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const grpcPort = process.env.GRPC_PORT || 50053;
  const grpcOptions = getMultiGrpcOptions(['commerciaux', 'contrats', 'products', 'commission', 'dashboard', 'bundle', 'subscriptions', 'subscription-plans', 'subscription-preferences', 'subscription-preference-schemas', 'woocommerce', 'partenaires'], {
    url: `0.0.0.0:${grpcPort}`,
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT || 3053;
  await app.listen(httpPort);

  console.log('========================================');
  console.log('SERVICE-COMMERCIAL STARTED');
  console.log('========================================');
  console.log(`HTTP Server: http://0.0.0.0:${httpPort}`);
  console.log(`gRPC [commerciaux, contrats, products, commission, dashboard, bundle, subscriptions, subscription-plans, woocommerce]: 0.0.0.0:${grpcPort}`);
  console.log('========================================');
}

bootstrap();
