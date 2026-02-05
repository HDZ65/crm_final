import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { LogisticsModule } from './logistics.module';

// Domain entities for TypeORM configuration
import {
  CarrierAccountEntity,
  ColisEntity,
  ExpeditionEntity,
  TrackingEventEntity,
} from './domain/logistics/entities';

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
        entities: [
          CarrierAccountEntity,
          ColisEntity,
          ExpeditionEntity,
          TrackingEventEntity,
        ],
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    // ========================================================================
    // DDD BOUNDED CONTEXT MODULES
    // ========================================================================
    LogisticsModule,
  ],

  controllers: [],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
