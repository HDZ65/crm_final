import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrilleTarifaireEntity } from './entities/grille-tarifaire.entity';
import { GrilleTarifaireService } from './grille-tarifaire.service';

@Module({
  imports: [TypeOrmModule.forFeature([GrilleTarifaireEntity])],
  providers: [GrilleTarifaireService],
  exports: [GrilleTarifaireService],
})
export class GrilleTarifaireModule {}
