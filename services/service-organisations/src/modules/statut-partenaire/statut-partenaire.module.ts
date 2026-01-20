import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutPartenaireEntity } from './entities/statut-partenaire.entity';
import { StatutPartenaireService } from './statut-partenaire.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutPartenaireEntity])],
  providers: [StatutPartenaireService],
  exports: [StatutPartenaireService],
})
export class StatutPartenaireModule {}
