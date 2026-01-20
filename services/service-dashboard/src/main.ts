import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || '50056';
  const grpcUrl = process.env.GRPC_URL || `0.0.0.0:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'dashboard',
        protoPath: join(__dirname, '../../proto/dashboard.proto'),
        url: grpcUrl,
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

  console.log(`SERVICE DASHBOARD - gRPC started on ${grpcUrl}`);
}

bootstrap();
