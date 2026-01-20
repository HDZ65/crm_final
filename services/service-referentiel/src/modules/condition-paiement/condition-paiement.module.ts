import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionPaiement } from './entities/condition-paiement.entity';
import { ConditionPaiementService } from './condition-paiement.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionPaiement])],
  providers: [ConditionPaiementService],
  exports: [ConditionPaiementService],
})
export class ConditionPaiementModule {}
