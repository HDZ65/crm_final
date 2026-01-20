import { Module } from '@nestjs/common';
import { EvolutionCaService } from './evolution-ca.service';

@Module({
  providers: [EvolutionCaService],
  exports: [EvolutionCaService],
})
export class EvolutionCaModule {}
