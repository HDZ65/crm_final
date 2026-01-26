import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ApporteurModule } from './modules/apporteur/apporteur.module';
import { BaremeCommissionModule } from './modules/bareme-commission/bareme-commission.module';
import { PalierCommissionModule } from './modules/palier-commission/palier-commission.module';
import { ModeleDistributionModule } from './modules/modele-distribution/modele-distribution.module';
import { CommerciauxController } from './commerciaux.controller';
import { Apporteur } from './modules/apporteur/entities/apporteur.entity';
import { BaremeCommission } from './modules/bareme-commission/entities/bareme-commission.entity';
import { PalierCommission } from './modules/palier-commission/entities/palier-commission.entity';
import { ModeleDistribution } from './modules/modele-distribution/entities/modele-distribution.entity';

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
        database: configService.get('DB_DATABASE', 'commerciaux_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [Apporteur, BaremeCommission, PalierCommission, ModeleDistribution],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    ApporteurModule,
    BaremeCommissionModule,
    PalierCommissionModule,
    ModeleDistributionModule,
  ],
  controllers: [CommerciauxController],
})
export class AppModule {}
