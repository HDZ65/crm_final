import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAuditLogEntity } from './entities/payment-audit-log.entity';
import { PaymentAuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PaymentAuditLogEntity])],
  providers: [PaymentAuditService],
  exports: [PaymentAuditService],
})
export class PaymentAuditModule {}
