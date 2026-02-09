import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor, NatsModule, GrpcExceptionFilter } from '@crm/shared-kernel';

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
  OAuthConnectionEntity,
  CalendarEventEntity,
  MeetingEntity,
  CallSummaryEntity,
} from './domain/engagement/entities';

import {
  DemandeConciergerie,
  CommentaireDemande,
  CasJuridique,
  OperationCashback,
} from './domain/services/entities';

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
        name: 'service-engagement',
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'engagement_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          NotificationEntity,
          MailboxEntity,
          ActiviteEntity,
          TacheEntity,
          TypeActiviteEntity,
          EvenementSuiviEntity,
          OAuthConnectionEntity,
          CalendarEventEntity,
          MeetingEntity,
          CallSummaryEntity,
          // Services entities
          DemandeConciergerie,
          CommentaireDemande,
          CasJuridique,
          OperationCashback,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
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
      }),
    }),

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
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
})
export class AppModule {}
