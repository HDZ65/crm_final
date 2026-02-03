import { Module } from '@nestjs/common';
import { EvolutionCaService } from './evolution-ca.service';
import { EvolutionCaController } from './evolution-ca.controller';

@Module({
  controllers: [EvolutionCaController],
  providers: [EvolutionCaService],
  exports: [EvolutionCaService],
})
export class EvolutionCaModule {}
