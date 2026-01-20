import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyDebitConfigurationEntity } from '../configuration/entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from '../configuration/entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from '../configuration/entities/contract-debit-configuration.entity.js';
import { HolidayEntity } from '../holidays/entities/holiday.entity.js';
import { CsvImportService } from './csv-import.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
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
export class CsvImportModule {}
