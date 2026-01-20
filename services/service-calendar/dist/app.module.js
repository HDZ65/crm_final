var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { EngineModule } from './modules/engine/engine.module.js';
import { ConfigurationModule } from './modules/configuration/configuration.module.js';
import { HolidaysModule } from './modules/holidays/holidays.module.js';
import { CsvImportModule } from './modules/csv-import/csv-import.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { HolidayZoneEntity } from './modules/holidays/entities/holiday-zone.entity.js';
import { HolidayEntity } from './modules/holidays/entities/holiday.entity.js';
import { CutoffConfigurationEntity } from './modules/configuration/entities/cutoff-configuration.entity.js';
import { SystemDebitConfigurationEntity } from './modules/configuration/entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './modules/configuration/entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './modules/configuration/entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './modules/configuration/entities/contract-debit-configuration.entity.js';
import { PlannedDebitEntity } from './modules/engine/entities/planned-debit.entity.js';
import { VolumeForecastEntity } from './modules/engine/entities/volume-forecast.entity.js';
import { VolumeThresholdEntity } from './modules/engine/entities/volume-threshold.entity.js';
import { CalendarAuditLogEntity } from './modules/audit/entities/calendar-audit-log.entity.js';
import { CalendarController } from './calendar.controller.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            TypeOrmModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
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
                    synchronize: configService.get('NODE_ENV') === 'development',
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
        controllers: [CalendarController],
        providers: [],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map