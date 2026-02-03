import { Module } from '@nestjs/common';
import { StatsSocietesService } from './stats-societes.service';
import { StatsSocietesController } from './stats-societes.controller';

@Module({
  controllers: [StatsSocietesController],
  providers: [StatsSocietesService],
  exports: [StatsSocietesService],
})
export class StatsSocietesModule {}
