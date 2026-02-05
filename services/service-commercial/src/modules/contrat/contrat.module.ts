import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratEntity } from './entities/contrat.entity';
import { ContratService } from './contrat.service';
import { ContratController } from './contrat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContratEntity])],
  controllers: [ContratController],
  providers: [ContratService],
  exports: [ContratService],
})
export class ContratModule {}
