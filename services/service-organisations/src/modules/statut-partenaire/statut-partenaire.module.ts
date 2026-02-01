import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutPartenaireEntity } from './entities/statut-partenaire.entity';
import { StatutPartenaireService } from './statut-partenaire.service';
import { StatutPartenaireController } from './statut-partenaire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutPartenaireEntity])],
  controllers: [StatutPartenaireController],
  providers: [StatutPartenaireService],
  exports: [StatutPartenaireService],
})
export class StatutPartenaireModule {}
