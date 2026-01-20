import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutFactureEntity } from './entities/statut-facture.entity';
import { StatutFactureService } from './statut-facture.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutFactureEntity])],
  providers: [StatutFactureService],
  exports: [StatutFactureService],
})
export class StatutFactureModule {}
