import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutContratEntity } from './entities/statut-contrat.entity';
import { StatutContratService } from './statut-contrat.service';
import { StatutContratController } from './statut-contrat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutContratEntity])],
  controllers: [StatutContratController],
  providers: [StatutContratService],
  exports: [StatutContratService],
})
export class StatutContratModule {}
