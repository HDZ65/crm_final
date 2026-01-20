import { Module } from '@nestjs/common';
import { StatsSocietesService } from './stats-societes.service';

@Module({
  providers: [StatsSocietesService],
  exports: [StatsSocietesService],
})
export class StatsSocietesModule {}
