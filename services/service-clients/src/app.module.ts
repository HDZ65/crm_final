import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule } from '@crm/nats-utils';

import { StatutClientModule } from './modules/statut-client/statut-client.module';
import { AdresseModule } from './modules/adresse/adresse.module';
import { ClientBaseModule } from './modules/client-base/client-base.module';
import { ClientEntrepriseModule } from './modules/client-entreprise/client-entreprise.module';
import { ClientPartenaireModule } from './modules/client-partenaire/client-partenaire.module';
import {
  ConditionPaiementModule,
  EmissionFactureModule,
  FacturationParModule,
  PeriodeFacturationModule,
  TransporteurCompteModule,
} from './modules/referentiel';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
        database: configService.get('DB_DATABASE', 'clients_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        // MIGRATIONS: synchronize désactivé en production
        // En dev, on peut l'activer temporairement si besoin
        synchronize: false,
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    StatutClientModule,
    AdresseModule,
    ClientBaseModule,
    ClientEntrepriseModule,
    ClientPartenaireModule,
    ConditionPaiementModule,
    EmissionFactureModule,
    FacturationParModule,
    PeriodeFacturationModule,
    TransporteurCompteModule,
  ],
  // Plus de controleur monolithique ici - chaque module a le sien
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
