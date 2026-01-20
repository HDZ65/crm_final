import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodeFacturation } from './entities/periode-facturation.entity';
import { PeriodeFacturationService } from './periode-facturation.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodeFacturation])],
  providers: [PeriodeFacturationService],
  exports: [PeriodeFacturationService],
})
export class PeriodeFacturationModule {}
