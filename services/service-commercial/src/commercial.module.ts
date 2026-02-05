import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ApporteurEntity,
  StatutCommissionEntity,
  BaremeCommissionEntity,
  PalierCommissionEntity,
  BordereauCommissionEntity,
  LigneBordereauEntity,
  CommissionEntity,
  CommissionRecurrenteEntity,
  ReportNegatifEntity,
  RepriseCommissionEntity,
  CommissionAuditLogEntity,
} from './domain/commercial/entities';

// Infrastructure services
import { ApporteurService } from './infrastructure/persistence/typeorm/repositories/commercial';

// Interface controllers
import { ApporteurController } from './interfaces/grpc/controllers/commercial';

// NATS handlers
import { PaymentReceivedHandler } from './infrastructure/messaging/nats/handlers';

// Cross-context dependencies
import { ContratsModule } from './contrats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApporteurEntity,
      StatutCommissionEntity,
      BaremeCommissionEntity,
      PalierCommissionEntity,
      BordereauCommissionEntity,
      LigneBordereauEntity,
      CommissionEntity,
      CommissionRecurrenteEntity,
      ReportNegatifEntity,
      RepriseCommissionEntity,
      CommissionAuditLogEntity,
    ]),
    forwardRef(() => ContratsModule),
  ],
  controllers: [
    ApporteurController,
  ],
  providers: [
    ApporteurService,
    PaymentReceivedHandler,
  ],
  exports: [
    ApporteurService,
  ],
})
export class CommercialModule {}
