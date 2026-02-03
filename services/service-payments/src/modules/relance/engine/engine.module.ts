import { Module } from '@nestjs/common';
import { RelanceEngineService } from './relance-engine.service';
import { EngineController } from './engine.controller';
import { RegleRelanceModule } from '../regle-relance/regle-relance.module';
import { HistoriqueRelanceModule } from '../historique-relance/historique-relance.module';

@Module({
  imports: [RegleRelanceModule, HistoriqueRelanceModule],
  controllers: [EngineController],
  providers: [RelanceEngineService],
  exports: [RelanceEngineService],
})
export class EngineModule {}
