import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PROVISIONING_BILLING_COMPENSATION_PORT,
  PROVISIONING_LIFECYCLE_REPOSITORY,
  PROVISIONING_NETWORTH_PORT,
  PROVISIONING_PAYMENTS_PORT,
  PROVISIONING_STELOGY_PORT,
  PROVISIONING_SUSPENSION_PORT,
  PROVISIONING_TERMINATION_PORT,
  PROVISIONING_TRANSATEL_PORT,
  ProvisioningSagaService,
} from './domain/provisioning/services';
import { ProvisioningLifecycleEntity } from './domain/provisioning/entities';
import { ProvisioningLifecycleService } from './infrastructure/persistence/typeorm/repositories/provisioning';
import {
  ActivationReelleHandler,
  ContractSignedHandler,
  FirstInvoicePaidHandler,
  GoCardlessPaymentSucceededHandler,
  MonthlyInvoicePaidHandler,
  RetractionDeadlineElapsedHandler,
  SuspensionRequestedHandler,
  TerminationRequestedHandler,
} from './infrastructure/messaging/nats/handlers';
import { ProvisioningJ14SchedulerService } from './infrastructure/scheduling/provisioning-j14-scheduler.service';
import { ProvisioningPaymentsGrpcClient } from './infrastructure/grpc/payments/provisioning-payments-grpc.client';
import { TransatelActivationMockService } from './infrastructure/external/telecom/transatel/transatel-activation-mock.service';
import { TransatelSuspensionMockService } from './infrastructure/external/telecom/transatel/transatel-suspension-mock.service';
import { TransatelTerminationMockService } from './infrastructure/external/telecom/transatel/transatel-termination-mock.service';
import { CfastBillingCompensationService } from './infrastructure/external/billing/cfast/cfast-billing-compensation.service';
import { TelecomProvisioningController } from './infrastructure/grpc/telecom';
import { NetworthActivationMockService } from './infrastructure/external/telecom/networth/networth-activation-mock.service';
import { StelogyActivationMockService } from './infrastructure/external/telecom/stelogy/stelogy-activation-mock.service';
import { CarrierSelectorService } from './domain/provisioning/services/carrier-selector.service';

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
      // TELECOM_CARRIER=transatel|networth|stelogy — conditional injection for multi-carrier support
      provide: PROVISIONING_NETWORTH_PORT,
      useClass: NetworthActivationMockService,
    },
    {
      // TELECOM_CARRIER=stelogy — conditional injection for multi-carrier support
      provide: PROVISIONING_STELOGY_PORT,
      useClass: StelogyActivationMockService,
    },
    {
      provide: PROVISIONING_BILLING_COMPENSATION_PORT,
      useClass: CfastBillingCompensationService,
    },
    {
      provide: PROVISIONING_SUSPENSION_PORT,
      useClass: TransatelSuspensionMockService,
    },
    {
      provide: PROVISIONING_TERMINATION_PORT,
      useClass: TransatelTerminationMockService,
    },
    ProvisioningSagaService,
    CarrierSelectorService,
    ProvisioningJ14SchedulerService,
    ContractSignedHandler,
    RetractionDeadlineElapsedHandler,
    FirstInvoicePaidHandler,
    MonthlyInvoicePaidHandler,
    GoCardlessPaymentSucceededHandler,
    ActivationReelleHandler,
    SuspensionRequestedHandler,
    TerminationRequestedHandler,
  ],
  exports: [ProvisioningLifecycleService, ProvisioningSagaService, CarrierSelectorService],
})
export class ProvisioningModule {}
