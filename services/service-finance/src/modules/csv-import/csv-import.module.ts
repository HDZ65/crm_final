import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyDebitConfigurationEntity } from '../configuration/entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from '../configuration/entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from '../configuration/entities/contract-debit-configuration.entity';
import { HolidayEntity } from '../holidays/entities/holiday.entity';
import { CsvImportService } from './csv-import.service';
import { CalendarAuditModule } from '../calendar-audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyDebitConfigurationEntity,
      ClientDebitConfigurationEntity,
      ContractDebitConfigurationEntity,
      HolidayEntity,
    ]),
    forwardRef(() => CalendarAuditModule),
  ],
  providers: [CsvImportService],
  exports: [CsvImportService],
})
export class CsvImportModule {}
