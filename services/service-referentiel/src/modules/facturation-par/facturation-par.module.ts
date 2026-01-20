import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturationPar } from './entities/facturation-par.entity';
import { FacturationParService } from './facturation-par.service';

@Module({
  imports: [TypeOrmModule.forFeature([FacturationPar])],
  providers: [FacturationParService],
  exports: [FacturationParService],
})
export class FacturationParModule {}
