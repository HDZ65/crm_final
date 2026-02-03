import { Module } from '@nestjs/common';
import { RepartitionProduitsService } from './repartition-produits.service';
import { RepartitionProduitsController } from './repartition-produits.controller';

@Module({
  controllers: [RepartitionProduitsController],
  providers: [RepartitionProduitsService],
  exports: [RepartitionProduitsService],
})
export class RepartitionProduitsModule {}
