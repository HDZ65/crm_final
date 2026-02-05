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
import { FactureService } from './infrastructure/persistence/typeorm/repositories/factures';

// Interface controllers
import { FactureController } from './interfaces/grpc/controllers/factures';

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
  ],
  providers: [
    FactureService,
  ],
  exports: [
    FactureService,
  ],
})
export class FacturesModule {}
