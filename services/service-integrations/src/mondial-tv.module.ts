import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import { BaremeCommissionEntity } from './domain/commercial/entities/bareme-commission.entity';
import { PalierCommissionEntity } from './domain/commercial/entities/palier-commission.entity';
import { CommissionCalculationService } from './domain/commercial/services/commission-calculation.service';
import { ClientExternalMappingEntity } from './domain/mondial-tv/entities/client-external-mapping.entity';
import { ImsWebhookEventEntity } from './domain/mondial-tv/entities/ims-webhook-event.entity';
import { StoreBillingRecordEntity } from './domain/mondial-tv/entities/store-billing-record.entity';
import { StoreConfigEntity } from './domain/mondial-tv/entities/store-config.entity';
import { TvodEstPurchaseEntity } from './domain/mondial-tv/entities/tvod-est-purchase.entity';
// Domain ports
import { IMS_CLIENT } from './domain/mondial-tv/ports/IImsClient';
// Domain services
import { CommissionChannelService } from './domain/mondial-tv/services/commission-channel.service';
import { StoreBillingService } from './domain/mondial-tv/services/store-billing.service';
// Infrastructure - External clients
import { MockImsClient } from './infrastructure/external/mondial-tv/mock-ims-client';
// Infrastructure - Persistence services
import { ClientExternalMappingService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/client-external-mapping.service';
import { ImsWebhookEventService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/ims-webhook-event.service';
import { StoreBillingRecordService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/store-billing-record.service';
import { StoreConfigService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/store-config.service';
import { TvodEstPurchaseService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/tvod-est-purchase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImsWebhookEventEntity,
      StoreConfigEntity,
      StoreBillingRecordEntity,
      ClientExternalMappingEntity,
      TvodEstPurchaseEntity,
      BaremeCommissionEntity,
      PalierCommissionEntity,
    ]),
  ],
  controllers: [],
  providers: [
    ImsWebhookEventService,
    StoreConfigService,
    StoreBillingRecordService,
    ClientExternalMappingService,
    TvodEstPurchaseService,
    MockImsClient,
    {
      provide: IMS_CLIENT,
      useExisting: MockImsClient,
    },
    CommissionCalculationService,
    CommissionChannelService,
    StoreBillingService,
  ],
  exports: [
    ImsWebhookEventService,
    StoreConfigService,
    StoreBillingRecordService,
    ClientExternalMappingService,
    TvodEstPurchaseService,
    MockImsClient,
    IMS_CLIENT,
    CommissionChannelService,
    StoreBillingService,
  ],
})
export class MondialTvModule {}
