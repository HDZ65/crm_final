import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor, NatsModule, GrpcExceptionFilter } from '@crm/shared-kernel';
import { ScheduleModule } from '@nestjs/schedule';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { LogisticsModule } from './logistics.module';
import { FulfillmentModule } from './fulfillment.module';



@Module({
  imports: [
    // ========================================================================
    // CORE INFRASTRUCTURE
    // ========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'logistics_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production' }
            : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    // NATS Messaging
    NatsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get<string>('NATS_URL', 'nats://localhost:4222'),
      }),
    }),

    // Scheduling (for cron jobs)
    ScheduleModule.forRoot(),

    // ========================================================================
    // DDD BOUNDED CONTEXT MODULES
    // ========================================================================
    LogisticsModule,
    FulfillmentModule,
  ],

  controllers: [],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
})
export class AppModule {}
