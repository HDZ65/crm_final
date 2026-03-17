import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ControleQualiteEntity,
  StatutCQEntity,
  CritereCQEntity,
  ResultatCritereEntity,
  RegleCQEntity,
  RegleCQCritereEntity,
} from './domain/qualite/entities';

// Contrat entity (for CQ handlers to update contrat.statut_cq)
import { ContratEntity } from './domain/contrats/entities/contrat.entity';

// Infrastructure services
import { ControleQualiteService } from './infrastructure/persistence/typeorm/repositories/qualite';

// Interface controllers
import { QualiteController } from './infrastructure/grpc/qualite';

// NATS handlers
import { CQValidatedHandler } from './infrastructure/messaging/nats/handlers/cq-validated.handler';
import { CQRejectedHandler } from './infrastructure/messaging/nats/handlers/cq-rejected.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ControleQualiteEntity,
      StatutCQEntity,
      CritereCQEntity,
      ResultatCritereEntity,
      RegleCQEntity,
      RegleCQCritereEntity,
      ContratEntity,
    ]),
  ],
  controllers: [QualiteController],
  providers: [
    ControleQualiteService,
    CQValidatedHandler,
    CQRejectedHandler,
  ],
  exports: [ControleQualiteService],
})
export class QualiteModule {}
