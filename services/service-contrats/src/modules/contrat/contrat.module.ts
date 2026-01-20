import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratEntity } from './entities/contrat.entity';
import { ContratService } from './contrat.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContratEntity])],
  providers: [ContratService],
  exports: [ContratService],
})
export class ContratModule {}
