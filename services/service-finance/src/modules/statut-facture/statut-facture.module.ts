import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutFactureEntity } from './entities/statut-facture.entity';
import { StatutFactureService } from './statut-facture.service';
import { StatutFactureController } from './statut-facture.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutFactureEntity])],
  controllers: [StatutFactureController],
  providers: [StatutFactureService],
  exports: [StatutFactureService],
})
export class StatutFactureModule {}
