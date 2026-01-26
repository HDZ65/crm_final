import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Entities
import { FactureEntity } from './modules/facture/entities/facture.entity';
import { LigneFactureEntity } from './modules/ligne-facture/entities/ligne-facture.entity';
import { StatutFactureEntity } from './modules/statut-facture/entities/statut-facture.entity';
import { EmissionFactureEntity } from './modules/emission-facture/entities/emission-facture.entity';
import { FactureSettingsEntity } from './modules/facture-settings/entities/facture-settings.entity';

// Modules
import { FactureModule } from './modules/facture/facture.module';
import { LigneFactureModule } from './modules/ligne-facture/ligne-facture.module';
import { StatutFactureModule } from './modules/statut-facture/statut-facture.module';
import { EmissionFactureModule } from './modules/emission-facture/emission-facture.module';
import { FactureSettingsModule } from './modules/facture-settings/facture-settings.module';
import { GenerationModule } from './modules/generation/generation.module';

// Controller
import { FacturesController } from './factures.controller';

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

    // Modules métier
    StatutFactureModule,
    EmissionFactureModule,
    LigneFactureModule,
    FactureModule,
    FactureSettingsModule,
    GenerationModule,
  ],
  controllers: [FacturesController],
  providers: [],
})
export class AppModule {}
