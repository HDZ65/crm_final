import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule } from '@crm/nats-utils';

// Entities
import { FactureEntity } from './modules/facture/entities/facture.entity';
import { LigneFactureEntity } from './modules/ligne-facture/entities/ligne-facture.entity';
import { StatutFactureEntity } from './modules/statut-facture/entities/statut-facture.entity';
import { EmissionFactureEntity } from './modules/emission-facture/entities/emission-facture.entity';
import { FactureSettingsEntity } from './modules/facture-settings/entities/facture-settings.entity';

// Modules - chaque module a son propre controleur
import { FactureModule } from './modules/facture/facture.module';
import { LigneFactureModule } from './modules/ligne-facture/ligne-facture.module';
import { StatutFactureModule } from './modules/statut-facture/statut-facture.module';
import { EmissionFactureModule } from './modules/emission-facture/emission-facture.module';
import { FactureSettingsModule } from './modules/facture-settings/facture-settings.module';
import { GenerationModule } from './modules/generation/generation.module';

@Module({
  imports: [
    // Configuration globale (variables d'environnement)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuration TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'factures_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          FactureEntity,
          LigneFactureEntity,
          StatutFactureEntity,
          EmissionFactureEntity,
          FactureSettingsEntity,
        ],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get<string>('NODE_ENV') === 'development',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),

    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),

    // Modules métier - chaque module importe son propre controleur
    StatutFactureModule,
    EmissionFactureModule,
    LigneFactureModule,
    FactureModule,
    FactureSettingsModule,
    GenerationModule,
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
