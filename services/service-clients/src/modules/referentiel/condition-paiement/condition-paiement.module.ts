import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionPaiementEntity } from './entities/condition-paiement.entity';
import { ConditionPaiementService } from './condition-paiement.service';
import { ConditionPaiementController } from './condition-paiement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionPaiementEntity])],
  controllers: [ConditionPaiementController],
  providers: [ConditionPaiementService],
  exports: [ConditionPaiementService],
})
export class ConditionPaiementModule {}
