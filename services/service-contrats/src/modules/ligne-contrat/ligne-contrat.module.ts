import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneContratEntity } from './entities/ligne-contrat.entity';
import { LigneContratService } from './ligne-contrat.service';

@Module({
  imports: [TypeOrmModule.forFeature([LigneContratEntity])],
  providers: [LigneContratService],
  exports: [LigneContratService],
})
export class LigneContratModule {}
