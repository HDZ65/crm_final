@nestjs/core';
import { AuthInterceptor } from '@crm/grpc-utils';

import { Module } from '@nestjs/common';;
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Modules - chaque module a son propre controleur
import { ConditionPaiementModule } from './modules/condition-paiement/condition-paiement.module';
import { StatutClientModule } from './modules/statut-client/statut-client.module';
import { FacturationParModule } from './modules/facturation-par/facturation-par.module';
import { PeriodeFacturationModule } from './modules/periode-facturation/periode-facturation.module';
import { EmissionFactureModule } from './modules/emission-facture/emission-facture.module';
import { TransporteurCompteModule } from './modules/transporteur-compte/transporteur-compte.module';

// Entities
import { ConditionPaiement } from './modules/condition-paiement/entities/condition-paiement.entity';
import { StatutClient } from './modules/statut-client/entities/statut-client.entity';
import { FacturationPar } from './modules/facturation-par/entities/facturation-par.entity';
import { PeriodeFacturation } from './modules/periode-facturation/entities/periode-facturation.entity';
import { EmissionFacture } from './modules/emission-facture/entities/emission-facture.entity';
import { TransporteurCompte } from './modules/transporteur-compte/entities/transporteur-compte.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'referentiel_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          ConditionPaiement,
          StatutClient,
          FacturationPar,
          PeriodeFacturation,
          EmissionFacture,
          TransporteurCompte,
        ],
        synchronize: false, // Desactive - utiliser les migrations
        migrationsRun: true, // Execute les migrations au demarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    // Chaque module importe son propre controleur
    ConditionPaiementModule,
    StatutClientModule,
    FacturationParModule,
    PeriodeFacturationModule,
    EmissionFactureModule,
    TransporteurCompteModule,
  ],
  // Plus de controleur monolithique ici - chaque module a le sien
  controllers: [],
})
export class AppModule {}
