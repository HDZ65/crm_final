import { Module } from '@nestjs/common';
import { RelanceEngineService } from './relance-engine.service';
import { RegleRelanceModule } from '../regle-relance/regle-relance.module';
import { HistoriqueRelanceModule } from '../historique-relance/historique-relance.module';

@Module({
  imports: [RegleRelanceModule, HistoriqueRelanceModule],
  providers: [RelanceEngineService],
  exports: [RelanceEngineService],
})
export class EngineModule {}
