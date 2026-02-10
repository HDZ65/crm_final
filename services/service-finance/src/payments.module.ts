import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

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
  PaymentStatusEntity,
  RejectionReasonEntity,
  ProviderStatusMappingEntity,
  ProviderRoutingRuleEntity,
  ProviderOverrideEntity,
  ProviderReassignmentJobEntity,
  AlertEntity,
  ExportJobEntity,
  RiskScoreEntity,
  CustomerInteractionEntity,
  ReconciliationEntity,
  PaymentArchiveEntity,
  DunningConfigEntity,
} from './domain/payments/entities';

// Infrastructure services
import {
  SchedulesService,
  RumGeneratorService,
  ArchiveSchedulerService,
  CustomerInteractionService,
  ScoringClientService,
  SelectiveDunningService,
} from './infrastructure/persistence/typeorm/repositories/payments';
import { ProviderStatusMappingService } from './infrastructure/persistence/typeorm/repositories/payments/provider-status-mapping.service';
import {
  EncryptionService,
  IbanMaskingService,
  SensitiveDataInterceptor,
} from './infrastructure/security';
import {
  MultiSafepayApiService,
  MultiSafepayWebhookHandler,
} from './infrastructure/psp/multisafepay';

// PSP connectors
import { SlimpayApiService, SlimpayWebhookHandler } from './infrastructure/psp/slimpay';
import { GoCardlessApiService, GoCardlessWebhookHandler } from './infrastructure/psp/gocardless';
import { StripeApiService, StripeWebhookHandler } from './infrastructure/psp/stripe';

// Interface controllers
import { SchedulesController, StatusMappingController } from './infrastructure/grpc/payments';
import { SlimpayController } from './interfaces/grpc/controllers/payments/slimpay.controller';
import { GoCardlessController } from './interfaces/grpc/controllers/payments/gocardless.controller';
import { MultiSafepayController } from './interfaces/grpc/controllers/payments/multisafepay.controller';
import { StripeController } from './interfaces/grpc/controllers/payments/stripe.controller';
import { ArchiveController } from './interfaces/grpc/controllers/payments/archive.controller';
import { ExportController } from './interfaces/grpc/controllers/payments/export.controller';
import { ExportService } from './infrastructure/persistence/typeorm/repositories/payments/export.service';
import { AlertController } from './interfaces/grpc/controllers/payments/alert.controller';
import { AlertService } from './infrastructure/persistence/typeorm/repositories/payments/alert.service';
import { DunningSeedService } from './infrastructure/persistence/typeorm/repositories/payments/dunning-seed.service';
import { CbUpdateSessionService } from './infrastructure/persistence/typeorm/repositories/payments/cb-update-session.service';
import { DunningMaxRetriesExceededHandler } from './infrastructure/messaging/nats/handlers/dunning-max-retries-exceeded.handler';
import { DepanssurPaymentFailedHandler } from './infrastructure/messaging/nats/handlers/depanssur-payment-failed.handler';
import { DepanssurPaymentSucceededHandler } from './infrastructure/messaging/nats/handlers/depanssur-payment-succeeded.handler';
import { DunningDepanssurService } from './domain/payments/services/dunning-depanssur.service';
import { SMS_SERVICE_TOKEN } from './infrastructure/external/sms/sms-service.interface';
import { MockSmsService } from './infrastructure/external/sms/mock-sms.service';
import { IMS_CLIENT_TOKEN } from './infrastructure/external/ims/ims-client.interface';
import { MockImsClientService } from './infrastructure/external/ims/mock-ims-client.service';
import { CbUpdateSessionController } from './interfaces/http/controllers/payments/cb-update-session.controller';
import { PaymentQueryService } from './application/queries/payment-query.service';
import { PaymentQueryController } from './interfaces/grpc/controllers/payments/payment-query.controller';
import { FacturesModule } from './factures.module';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    FacturesModule,
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
      PaymentStatusEntity,
      RejectionReasonEntity,
      ProviderStatusMappingEntity,
      ProviderRoutingRuleEntity,
      ProviderOverrideEntity,
      ProviderReassignmentJobEntity,
      AlertEntity,
      ExportJobEntity,
      RiskScoreEntity,
      CustomerInteractionEntity,
      ReconciliationEntity,
      PaymentArchiveEntity,
      DunningConfigEntity,
    ]),
  ],
  controllers: [
    SchedulesController,
    StatusMappingController,
    SlimpayController,
    GoCardlessController,
    MultiSafepayController,
    StripeController,
    ArchiveController,
    ExportController,
    AlertController,
    CbUpdateSessionController,
    PaymentQueryController,
  ],
  providers: [
    SchedulesService,
    RumGeneratorService,
    ProviderStatusMappingService,
    EncryptionService,
    IbanMaskingService,
    SlimpayApiService,
    SlimpayWebhookHandler,
    GoCardlessApiService,
    GoCardlessWebhookHandler,
    MultiSafepayApiService,
    MultiSafepayWebhookHandler,
    StripeApiService,
    StripeWebhookHandler,
    ArchiveSchedulerService,
    CustomerInteractionService,
    ScoringClientService,
    ExportService,
    AlertService,
    SelectiveDunningService,
    DunningSeedService,
    CbUpdateSessionService,
    DunningMaxRetriesExceededHandler,
    DunningDepanssurService,
    DepanssurPaymentFailedHandler,
    DepanssurPaymentSucceededHandler,
    PaymentQueryService,
    {
      provide: SMS_SERVICE_TOKEN,
      useClass: MockSmsService,
    },
    {
      provide: IMS_CLIENT_TOKEN,
      useClass: MockImsClientService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveDataInterceptor,
    },
  ],
  exports: [
    SchedulesService,
    RumGeneratorService,
    ProviderStatusMappingService,
    EncryptionService,
    IbanMaskingService,
    SlimpayApiService,
    SlimpayWebhookHandler,
    GoCardlessApiService,
    GoCardlessWebhookHandler,
    MultiSafepayApiService,
    MultiSafepayWebhookHandler,
    StripeApiService,
    StripeWebhookHandler,
    ArchiveSchedulerService,
    CustomerInteractionService,
    ScoringClientService,
    ExportService,
    AlertService,
    SelectiveDunningService,
    DunningSeedService,
    CbUpdateSessionService,
    DunningMaxRetriesExceededHandler,
    DunningDepanssurService,
    DepanssurPaymentFailedHandler,
    DepanssurPaymentSucceededHandler,
    PaymentQueryService,
    SMS_SERVICE_TOKEN,
    IMS_CLIENT_TOKEN,
  ],
})
export class PaymentsModule {}
