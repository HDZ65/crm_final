import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule, ProcessedEvent } from '@crm/nats-utils';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { EngagementModule } from './engagement.module';

// Domain entities for TypeORM configuration
import {
  NotificationEntity,
  MailboxEntity,
  ActiviteEntity,
  TacheEntity,
  TypeActiviteEntity,
  EvenementSuiviEntity,
} from './domain/engagement/entities';

const createDbConfig = (configService: ConfigService, database: string, entities: any[] = []) => ({
  type: 'postgres' as const,
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database,
  namingStrategy: new SnakeNamingStrategy(),
  entities,
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl:
    configService.get<string>('DB_SSL') === 'true'
      ? {
          rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production',
        }
      : false,
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

@Module({
  imports: [
    // ========================================================================
    // CORE INFRASTRUCTURE
    // ========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDbConfig(configService, 'engagement_db', [
          NotificationEntity,
          MailboxEntity,
          ActiviteEntity,
          TacheEntity,
          TypeActiviteEntity,
          EvenementSuiviEntity,
          ProcessedEvent,
        ]),
    }),

    TypeOrmModule.forRootAsync({
      name: 'contrats',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'contrats_db', [ProcessedEvent]),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      name: 'factures',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'factures_db'),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      name: 'clients',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'clients_db'),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      name: 'products',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'products_db'),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      name: 'commerciaux',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'commerciaux_db'),
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      name: 'organisations',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'organisations_db'),
      inject: [ConfigService],
    }),

    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),

    // ========================================================================
    // DDD BOUNDED CONTEXT MODULES
    // ========================================================================
    EngagementModule,
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
