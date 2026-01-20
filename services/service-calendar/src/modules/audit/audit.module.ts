import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarAuditLogEntity } from './entities/calendar-audit-log.entity.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarAuditLogEntity]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
