import { Module } from '@nestjs/common';
import { RepartitionProduitsService } from './repartition-produits.service';

@Module({
  providers: [RepartitionProduitsService],
  exports: [RepartitionProduitsService],
})
export class RepartitionProduitsModule {}
