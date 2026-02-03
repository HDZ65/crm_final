import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodeFacturationEntity } from './entities/periode-facturation.entity';
import { PeriodeFacturationService } from './periode-facturation.service';
import { PeriodeFacturationController } from './periode-facturation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodeFacturationEntity])],
  controllers: [PeriodeFacturationController],
  providers: [PeriodeFacturationService],
  exports: [PeriodeFacturationService],
})
export class PeriodeFacturationModule {}
