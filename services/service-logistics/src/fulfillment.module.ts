import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  FulfillmentBatchEntity,
  FulfillmentBatchLineEntity,
  FulfillmentCutoffConfigEntity,
  AddressSnapshotEntity,
  PreferenceSnapshotEntity,
} from './domain/fulfillment/entities';

// Domain services
import { BatchSnapshotService } from './domain/fulfillment/services/batch-snapshot.service';

// Infrastructure services (TypeORM repositories)
import {
  FulfillmentCutoffConfigService,
  FulfillmentBatchRepositoryService,
  FulfillmentBatchLineRepositoryService,
  AddressSnapshotRepositoryService,
  PreferenceSnapshotRepositoryService,
} from './infrastructure/persistence/typeorm/repositories/fulfillment';

// Infrastructure messaging (NATS handlers)
import { SubscriptionEventHandler } from './infrastructure/messaging/nats/handlers/subscription-event.handler';

// Interface controllers (gRPC)
import { FulfillmentBatchController } from './infrastructure/grpc';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FulfillmentBatchEntity,
      FulfillmentBatchLineEntity,
      FulfillmentCutoffConfigEntity,
      AddressSnapshotEntity,
      PreferenceSnapshotEntity,
    ]),
  ],
  controllers: [FulfillmentBatchController],
  providers: [
    // Repositories
    FulfillmentCutoffConfigService,
    FulfillmentBatchRepositoryService,
    FulfillmentBatchLineRepositoryService,
    AddressSnapshotRepositoryService,
    PreferenceSnapshotRepositoryService,
    // Domain services
    BatchSnapshotService,
    // NATS handlers
    SubscriptionEventHandler,
  ],
  exports: [
    FulfillmentCutoffConfigService,
    FulfillmentBatchRepositoryService,
    FulfillmentBatchLineRepositoryService,
    AddressSnapshotRepositoryService,
    PreferenceSnapshotRepositoryService,
    BatchSnapshotService,
  ],
})
export class FulfillmentModule {}
