import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrilleTarifaireEntity } from './entities/grille-tarifaire.entity';
import { GrilleTarifaireService } from './grille-tarifaire.service';
import { GrilleTarifaireController } from './grille-tarifaire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GrilleTarifaireEntity])],
  controllers: [GrilleTarifaireController],
  providers: [GrilleTarifaireService],
  exports: [GrilleTarifaireService],
})
export class GrilleTarifaireModule {}
