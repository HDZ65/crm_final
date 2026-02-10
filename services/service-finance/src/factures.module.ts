import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  FactureEntity,
  LigneFactureEntity,
  StatutFactureEntity,
  EmissionFactureEntity,
  FactureSettingsEntity,
  InvoiceEntity,
  InvoiceItemEntity,
  RegleRelanceEntity,
  HistoriqueRelanceEntity,
} from './domain/factures/entities';

// Infrastructure services
import {
  ConsolidatedBillingService,
  FactureService,
} from './infrastructure/persistence/typeorm/repositories/factures';
import { BundlePriceRecalculatedHandler } from './infrastructure/messaging/nats/handlers';

// Interface controllers
import { FactureController, StatutFactureController } from './infrastructure/grpc/factures';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FactureEntity,
      LigneFactureEntity,
      StatutFactureEntity,
      EmissionFactureEntity,
      FactureSettingsEntity,
      InvoiceEntity,
      InvoiceItemEntity,
      RegleRelanceEntity,
      HistoriqueRelanceEntity,
    ]),
  ],
  controllers: [
    FactureController,
    StatutFactureController,
  ],
  providers: [
    FactureService,
    ConsolidatedBillingService,
    BundlePriceRecalculatedHandler,
  ],
  exports: [
    FactureService,
    ConsolidatedBillingService,
  ],
})
export class FacturesModule {}
