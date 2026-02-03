import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionAuditLogEntity } from './entities/commission-audit-log.entity';
import { CommissionAuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionAuditLogEntity])],
  controllers: [AuditController],
  providers: [CommissionAuditService],
  exports: [CommissionAuditService],
})
export class CommissionAuditModule {}
