import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureEntity } from './entities/facture.entity';
import { LigneFactureEntity } from '../ligne-facture/entities/ligne-facture.entity';
import { FactureService } from './facture.service';
import { StatutFactureModule } from '../statut-facture/statut-facture.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FactureEntity, LigneFactureEntity]),
    StatutFactureModule,
  ],
  providers: [FactureService],
  exports: [FactureService],
})
export class FactureModule {}
