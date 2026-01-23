import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionAuditLogEntity } from './entities/commission-audit-log.entity';
import { CommissionAuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionAuditLogEntity])],
  providers: [CommissionAuditService],
  exports: [CommissionAuditService],
})
export class CommissionAuditModule {}
