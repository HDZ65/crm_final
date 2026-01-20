var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDebitConfigurationEntity } from '../configuration/entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from '../configuration/entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from '../configuration/entities/contract-debit-configuration.entity.js';
import { HolidayEntity } from '../holidays/entities/holiday.entity.js';
import { CsvImportService } from './csv-import.service.js';
import { AuditModule } from '../audit/audit.module.js';
let CsvImportModule = class CsvImportModule {
};
CsvImportModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([
                CompanyDebitConfigurationEntity,
                ClientDebitConfigurationEntity,
                ContractDebitConfigurationEntity,
                HolidayEntity,
            ]),
            AuditModule,
        ],
        providers: [CsvImportService],
        exports: [CsvImportService],
    })
], CsvImportModule);
export { CsvImportModule };
//# sourceMappingURL=csv-import.module.js.map