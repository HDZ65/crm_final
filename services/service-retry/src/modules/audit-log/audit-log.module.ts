import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryAuditLogEntity } from './entities/retry-audit-log.entity';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetryAuditLogEntity])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
