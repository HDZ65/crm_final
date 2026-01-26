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
import { CommissionAuditModule } from './modules/audit/audit.module';
import { RecurrenceModule } from './modules/recurrence/recurrence.module';
import { ReportNegatifModule } from './modules/report/report.module';

import { CommissionController } from './commission.controller';

import { CommissionEntity } from './modules/commission/entities/commission.entity';
import { BaremeCommissionEntity } from './modules/bareme/entities/bareme-commission.entity';
import { PalierCommissionEntity } from './modules/palier/entities/palier-commission.entity';
import { BordereauCommissionEntity } from './modules/bordereau/entities/bordereau-commission.entity';
import { LigneBordereauEntity } from './modules/ligne-bordereau/entities/ligne-bordereau.entity';
import { RepriseCommissionEntity } from './modules/reprise/entities/reprise-commission.entity';
import { StatutCommissionEntity } from './modules/statut/entities/statut-commission.entity';
import { CommissionAuditLogEntity } from './modules/audit/entities/commission-audit-log.entity';
import { CommissionRecurrenteEntity } from './modules/recurrence/entities/commission-recurrente.entity';
import { ReportNegatifEntity } from './modules/report/entities/report-negatif.entity';

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
          CommissionAuditLogEntity,
          CommissionRecurrenteEntity,
          ReportNegatifEntity,
        ],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
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
    CommissionModule,
    BaremeModule,
    PalierModule,
    BordereauModule,
    LigneBordereauModule,
    RepriseModule,
    StatutModule,
    EngineModule,
    CommissionAuditModule,
    RecurrenceModule,
    ReportNegatifModule,
  ],
  controllers: [CommissionController],
})
export class AppModule {}
