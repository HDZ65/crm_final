import { Module } from '@nestjs/common';
import { KpisCommerciauxService } from './kpis-commerciaux.service';
import { KpisCommerciauxController } from './kpis-commerciaux.controller';

@Module({
  controllers: [KpisCommerciauxController],
  providers: [KpisCommerciauxService],
  exports: [KpisCommerciauxService],
})
export class KpisCommerciauxModule {}
