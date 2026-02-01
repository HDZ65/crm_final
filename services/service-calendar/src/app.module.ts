import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { EngineModule } from './modules/engine/engine.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { CsvImportModule } from './modules/csv-import/csv-import.module';
import { AuditModule } from './modules/audit/audit.module';

import { HolidayZoneEntity } from './modules/holidays/entities/holiday-zone.entity';
import { HolidayEntity } from './modules/holidays/entities/holiday.entity';
import { CutoffConfigurationEntity } from './modules/configuration/entities/cutoff-configuration.entity';
import { SystemDebitConfigurationEntity } from './modules/configuration/entities/system-debit-configuration.entity';
import { CompanyDebitConfigurationEntity } from './modules/configuration/entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from './modules/configuration/entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from './modules/configuration/entities/contract-debit-configuration.entity';
import { PlannedDebitEntity } from './modules/engine/entities/planned-debit.entity';
import { VolumeForecastEntity } from './modules/engine/entities/volume-forecast.entity';
import { VolumeThresholdEntity } from './modules/engine/entities/volume-threshold.entity';
import { CalendarAuditLogEntity } from './modules/audit/entities/calendar-audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        database: configService.get('DB_DATABASE', 'calendar_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          HolidayZoneEntity,
          HolidayEntity,
          CutoffConfigurationEntity,
          SystemDebitConfigurationEntity,
          CompanyDebitConfigurationEntity,
          ClientDebitConfigurationEntity,
          ContractDebitConfigurationEntity,
          PlannedDebitEntity,
          VolumeForecastEntity,
          VolumeThresholdEntity,
          CalendarAuditLogEntity,
        ],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    EngineModule,
    ConfigurationModule,
    HolidaysModule,
    CsvImportModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
