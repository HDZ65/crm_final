import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarAuditLogEntity } from './entities/calendar-audit-log.entity';
import { CalendarAuditService } from './audit.service';
import { CalendarAuditController } from './audit.controller';
import { CsvImportModule } from '../csv-import/csv-import.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarAuditLogEntity]),
    forwardRef(() => CsvImportModule),
  ],
  controllers: [CalendarAuditController],
  providers: [CalendarAuditService],
  exports: [CalendarAuditService],
})
export class CalendarAuditModule {}
