import { Module } from '@nestjs/common';
import { KpisService } from './kpis.service';

@Module({
  providers: [KpisService],
  exports: [KpisService],
})
export class KpisModule {}
