import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || '50070';
  const grpcUrl = process.env.GRPC_URL || `0.0.0.0:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'calendar',
      protoPath: join(process.cwd(), 'proto/calendar/calendar.proto'),
      url: grpcUrl,
      maxReceiveMessageLength: 20 * 1024 * 1024,
      maxSendMessageLength: 20 * 1024 * 1024,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_DATABASE || 'calendar_db';

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        📅 Service Calendar - gRPC Microservice               ║
╠══════════════════════════════════════════════════════════════╣
║   gRPC URL:    ${grpcUrl.padEnd(46)} ║
║   Database:    ${`${dbHost}:${dbPort}/${dbName}`.padEnd(46)} ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(46)} ║
╠══════════════════════════════════════════════════════════════╣
║   Features:                                                  ║
║   - Calendar Engine (plannedDebitDate calculation)           ║
║   - Lots L1-L4 + Fixed Day configuration                     ║
║   - Priority: Contract > Client > Company > System           ║
║   - Holiday management by zone/country                       ║
║   - CSV Import with dry-run validation                       ║
║   - Volume heatmap & thresholds                              ║
║   - Complete audit trail                                     ║
╠══════════════════════════════════════════════════════════════╣
║   gRPC Services:                                             ║
║   - CalendarEngineService.CalculatePlannedDate               ║
║   - DebitConfigurationService.ResolveConfiguration           ║
║   - HolidayService.CheckDateEligibility                      ║
║   - CalendarAdminService.GetCalendarView                     ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
