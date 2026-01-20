import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueStatutContratEntity } from './entities/historique-statut-contrat.entity';
import { HistoriqueStatutContratService } from './historique-statut-contrat.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriqueStatutContratEntity])],
  providers: [HistoriqueStatutContratService],
  exports: [HistoriqueStatutContratService],
})
export class HistoriqueStatutContratModule {}
