import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule, ProcessedEvent } from '@crm/nats-utils';

import { KpisModule } from './modules/kpis/kpis.module';
import { EvolutionCaModule } from './modules/evolution-ca/evolution-ca.module';
import { RepartitionProduitsModule } from './modules/repartition-produits/repartition-produits.module';
import { StatsSocietesModule } from './modules/stats-societes/stats-societes.module';
import { AlertesModule } from './modules/alertes/alertes.module';
import { KpisCommerciauxModule } from './modules/kpis-commerciaux/kpis-commerciaux.module';
import { EventsModule } from './modules/events/events.module';

// Helper function to create a database connection config
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
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

@Module({
  imports: [
    // Configuration globale (variables d'environnement)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'contrats_db', [ProcessedEvent]),
      inject: [ConfigService],
    }),

    // Factures connection - factures_db
    TypeOrmModule.forRootAsync({
      name: 'factures',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'factures_db'),
      inject: [ConfigService],
    }),

    // Clients connection - clients_db
    TypeOrmModule.forRootAsync({
      name: 'clients',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'clients_db'),
      inject: [ConfigService],
    }),

    // Products connection - products_db
    TypeOrmModule.forRootAsync({
      name: 'products',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'products_db'),
      inject: [ConfigService],
    }),

    // Commerciaux connection - commerciaux_db
    TypeOrmModule.forRootAsync({
      name: 'commerciaux',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'commerciaux_db'),
      inject: [ConfigService],
    }),

    // Organisations connection - organisations_db
    TypeOrmModule.forRootAsync({
      name: 'organisations',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDbConfig(configService, 'organisations_db'),
      inject: [ConfigService],
    }),

    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    KpisModule,
    EvolutionCaModule,
    RepartitionProduitsModule,
    StatsSocietesModule,
    AlertesModule,
    KpisCommerciauxModule,
    EventsModule,
  ],
  // Plus de controleur monolithique ici - chaque module a le sien
  controllers: [],
  providers: [  {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
