import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionPaiement } from './entities/condition-paiement.entity';
import { ConditionPaiementService } from './condition-paiement.service';
import { ConditionPaiementController } from './condition-paiement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionPaiement])],
  controllers: [ConditionPaiementController],
  providers: [ConditionPaiementService],
  exports: [ConditionPaiementService],
})
export class ConditionPaiementModule {}
