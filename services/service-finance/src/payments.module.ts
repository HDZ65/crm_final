import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ScheduleEntity,
  PaymentIntentEntity,
  PaymentEventEntity,
  PortalPaymentSessionEntity,
  PortalSessionAuditEntity,
  PSPEventInboxEntity,
  StripeAccountEntity,
  PaypalAccountEntity,
  GoCardlessAccountEntity,
  GoCardlessMandateEntity,
  SlimpayAccountEntity,
  MultiSafepayAccountEntity,
  EmerchantpayAccountEntity,
  RetryPolicyEntity,
  RetryScheduleEntity,
  RetryJobEntity,
  RetryAttemptEntity,
  ReminderPolicyEntity,
  ReminderEntity,
  RetryAuditLogEntity,
  PaymentAuditLogEntity,
} from './domain/payments/entities';

// Infrastructure services
import { SchedulesService } from './infrastructure/persistence/typeorm/repositories/payments';

// Interface controllers
import { SchedulesController } from './interfaces/grpc/controllers/payments';

// NATS handlers
import { ContractSignedHandler } from './infrastructure/messaging/nats/handlers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleEntity,
      PaymentIntentEntity,
      PaymentEventEntity,
      PortalPaymentSessionEntity,
      PortalSessionAuditEntity,
      PSPEventInboxEntity,
      StripeAccountEntity,
      PaypalAccountEntity,
      GoCardlessAccountEntity,
      GoCardlessMandateEntity,
      SlimpayAccountEntity,
      MultiSafepayAccountEntity,
      EmerchantpayAccountEntity,
      RetryPolicyEntity,
      RetryScheduleEntity,
      RetryJobEntity,
      RetryAttemptEntity,
      ReminderPolicyEntity,
      ReminderEntity,
      RetryAuditLogEntity,
      PaymentAuditLogEntity,
    ]),
  ],
  controllers: [
    SchedulesController,
  ],
  providers: [
    SchedulesService,
    ContractSignedHandler,
  ],
  exports: [
    SchedulesService,
  ],
})
export class PaymentsModule {}
