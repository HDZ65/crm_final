import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor, NatsModule, GrpcExceptionFilter } from '@crm/shared-kernel';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { FacturesModule } from './factures.module';
import { PaymentsModule } from './payments.module';
import { CalendarModule } from './calendar.module';

@Module({
  imports: [
    // ========================================================================
    // CORE INFRASTRUCTURE
    // ========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    NatsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get('NATS_URL', 'nats://localhost:4222'),
        name: 'service-finance',
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'finance_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrationsRun: configService.get('MIGRATIONS_RUN', 'true') === 'true',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production' }
            : false,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    // ========================================================================
    // DDD BOUNDED CONTEXT MODULES
    // ========================================================================
    FacturesModule,
    PaymentsModule,
    CalendarModule,
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
