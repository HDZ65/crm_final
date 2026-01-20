import { Module } from '@nestjs/common';
import { KpisCommerciauxService } from './kpis-commerciaux.service';

@Module({
  providers: [KpisCommerciauxService],
  exports: [KpisCommerciauxService],
})
export class KpisCommerciauxModule {}
