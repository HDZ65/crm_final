import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { CommissionModule } from './modules/commission/commission.module';
import { BaremeModule } from './modules/bareme/bareme.module';
import { PalierModule } from './modules/palier/palier.module';
import { BordereauModule } from './modules/bordereau/bordereau.module';
import { LigneBordereauModule } from './modules/ligne-bordereau/ligne-bordereau.module';
import { RepriseModule } from './modules/reprise/reprise.module';
import { StatutModule } from './modules/statut/statut.module';
import { EngineModule } from './modules/engine/engine.module';

import { CommissionController } from './commission.controller';

import { CommissionEntity } from './modules/commission/entities/commission.entity';
import { BaremeCommissionEntity } from './modules/bareme/entities/bareme-commission.entity';
import { PalierCommissionEntity } from './modules/palier/entities/palier-commission.entity';
import { BordereauCommissionEntity } from './modules/bordereau/entities/bordereau-commission.entity';
import { LigneBordereauEntity } from './modules/ligne-bordereau/entities/ligne-bordereau.entity';
import { RepriseCommissionEntity } from './modules/reprise/entities/reprise-commission.entity';
import { StatutCommissionEntity } from './modules/statut/entities/statut-commission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'commission_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          CommissionEntity,
          BaremeCommissionEntity,
          PalierCommissionEntity,
          BordereauCommissionEntity,
          LigneBordereauEntity,
          RepriseCommissionEntity,
          StatutCommissionEntity,
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
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
    CommissionModule,
    BaremeModule,
    PalierModule,
    BordereauModule,
    LigneBordereauModule,
    RepriseModule,
    StatutModule,
    EngineModule,
  ],
  controllers: [CommissionController],
})
export class AppModule {}
