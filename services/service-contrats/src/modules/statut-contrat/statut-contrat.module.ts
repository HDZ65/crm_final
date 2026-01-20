import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutContratEntity } from './entities/statut-contrat.entity';
import { StatutContratService } from './statut-contrat.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutContratEntity])],
  providers: [StatutContratService],
  exports: [StatutContratService],
})
export class StatutContratModule {}
