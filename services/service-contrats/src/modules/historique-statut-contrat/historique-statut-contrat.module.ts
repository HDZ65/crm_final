import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueStatutContratEntity } from './entities/historique-statut-contrat.entity';
import { HistoriqueStatutContratService } from './historique-statut-contrat.service';
import { HistoriqueStatutContratController } from './historique-statut-contrat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriqueStatutContratEntity])],
  controllers: [HistoriqueStatutContratController],
  providers: [HistoriqueStatutContratService],
  exports: [HistoriqueStatutContratService],
})
export class HistoriqueStatutContratModule {}
