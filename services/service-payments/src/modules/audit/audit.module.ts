import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAuditLogEntity } from './entities/payment-audit-log.entity';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PaymentAuditLogEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
