import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule, ProcessedEvent } from '@crm/nats-utils';

import { MailboxModule } from './modules/email/mailbox/mailbox.module';
import { GoogleOAuthModule } from './modules/email/oauth/google/google-oauth.module';
import { MicrosoftOAuthModule } from './modules/email/oauth/microsoft/microsoft-oauth.module';
import { OperationsModule } from './modules/email/operations/operations.module';

import { NotificationModule } from './modules/notifications/notification/notification.module';
import { WebSocketModule } from './modules/notifications/websocket/websocket.module';

import { KpisModule } from './modules/dashboard/kpis/kpis.module';
import { EvolutionCaModule } from './modules/dashboard/evolution-ca/evolution-ca.module';
import { RepartitionProduitsModule } from './modules/dashboard/repartition-produits/repartition-produits.module';
import { StatsSocietesModule } from './modules/dashboard/stats-societes/stats-societes.module';
import { AlertesModule } from './modules/dashboard/alertes/alertes.module';
import { KpisCommerciauxModule } from './modules/dashboard/kpis-commerciaux/kpis-commerciaux.module';

import { EventsModule } from './modules/events/events.module';

// Activités modules (consolidated from service-activites)
import { ActiviteModule } from './modules/activite/activite.module';
import { TacheModule } from './modules/tache/tache.module';
import { TypeActiviteModule } from './modules/type-activite/type-activite.module';
import { EvenementSuiviModule } from './modules/evenement-suivi/evenement-suivi.module';

import { MailboxEntity } from './modules/email/mailbox/entities/mailbox.entity';
import { NotificationEntity } from './modules/notifications/notification/entities/notification.entity';
import { EncryptionService } from './common/encryption.service';

// Activités entities (consolidated from service-activites)
import { Activite } from './modules/activite/entities/activite.entity';
import { Tache } from './modules/tache/entities/tache.entity';
import { TypeActivite } from './modules/type-activite/entities/type-activite.entity';
import { EvenementSuivi } from './modules/evenement-suivi/entities/evenement-suivi.entity';

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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDbConfig(configService, 'engagement_db', [
          MailboxEntity,
          NotificationEntity,
          ProcessedEvent,
          // Activités entities
          Activite,
          Tache,
          TypeActivite,
          EvenementSuivi,
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

    MailboxModule,
    GoogleOAuthModule,
    MicrosoftOAuthModule,
    OperationsModule,

    WebSocketModule,
    NotificationModule,

    KpisModule,
    EvolutionCaModule,
    RepartitionProduitsModule,
    StatsSocietesModule,
    AlertesModule,
KpisCommerciauxModule,

    EventsModule,

    // Activités modules (consolidated from service-activites)
    ActiviteModule,
    TacheModule,
    TypeActiviteModule,
    EvenementSuiviModule,
  ],
  controllers: [],
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
