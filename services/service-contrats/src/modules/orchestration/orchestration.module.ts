import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestrationHistoryEntity } from './entities/orchestration-history.entity';
import { OrchestrationService } from './orchestration.service';
import { PaymentClientService } from './payment-client.service';
import { OrchestrationController } from './orchestration.controller';
import { ContratModule } from '../contrat/contrat.module';
import { StatutContratModule } from '../statut-contrat/statut-contrat.module';
import { HistoriqueStatutContratModule } from '../historique-statut-contrat/historique-statut-contrat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrchestrationHistoryEntity]),
    ContratModule,
    StatutContratModule,
    HistoriqueStatutContratModule,
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService, PaymentClientService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
