import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarAuditLogEntity } from './entities/calendar-audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { CsvImportModule } from '../csv-import/csv-import.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarAuditLogEntity]),
    forwardRef(() => CsvImportModule),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
