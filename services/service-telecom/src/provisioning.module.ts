import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PROVISIONING_BILLING_COMPENSATION_PORT,
  PROVISIONING_LIFECYCLE_REPOSITORY,
  PROVISIONING_PAYMENTS_PORT,
  PROVISIONING_TRANSATEL_PORT,
  ProvisioningSagaService,
} from './domain/provisioning/services';
import { ProvisioningLifecycleEntity } from './domain/provisioning/entities';
import { ProvisioningLifecycleService } from './infrastructure/persistence/typeorm/repositories/provisioning';
import {
  ContractSignedHandler,
  FirstInvoicePaidHandler,
  GoCardlessPaymentSucceededHandler,
  MonthlyInvoicePaidHandler,
  RetractionDeadlineElapsedHandler,
} from './infrastructure/messaging/nats/handlers';
import { ProvisioningJ14SchedulerService } from './infrastructure/scheduling/provisioning-j14-scheduler.service';
import { ProvisioningPaymentsGrpcClient } from './infrastructure/grpc/payments/provisioning-payments-grpc.client';
import { TransatelActivationMockService } from './infrastructure/external/telecom/transatel/transatel-activation-mock.service';
import { CfastBillingCompensationService } from './infrastructure/external/billing/cfast/cfast-billing-compensation.service';
import { TelecomProvisioningController } from './infrastructure/grpc/telecom';

@Module({
  imports: [TypeOrmModule.forFeature([ProvisioningLifecycleEntity])],
  controllers: [TelecomProvisioningController],
  providers: [
    ProvisioningLifecycleService,
    {
      provide: PROVISIONING_LIFECYCLE_REPOSITORY,
      useExisting: ProvisioningLifecycleService,
    },
    {
      provide: PROVISIONING_PAYMENTS_PORT,
      useClass: ProvisioningPaymentsGrpcClient,
    },
    {
      provide: PROVISIONING_TRANSATEL_PORT,
      useClass: TransatelActivationMockService,
    },
    {
      provide: PROVISIONING_BILLING_COMPENSATION_PORT,
      useClass: CfastBillingCompensationService,
    },
    ProvisioningSagaService,
    ProvisioningJ14SchedulerService,
    ContractSignedHandler,
    RetractionDeadlineElapsedHandler,
    FirstInvoicePaidHandler,
    MonthlyInvoicePaidHandler,
    GoCardlessPaymentSucceededHandler,
  ],
  exports: [ProvisioningLifecycleService, ProvisioningSagaService],
})
export class ProvisioningModule {}
