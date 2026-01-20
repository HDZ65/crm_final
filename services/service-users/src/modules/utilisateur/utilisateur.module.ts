import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateurEntity } from './entities/utilisateur.entity';
import { UtilisateurService } from './utilisateur.service';

@Module({
  imports: [TypeOrmModule.forFeature([UtilisateurEntity])],
  providers: [UtilisateurService],
  exports: [UtilisateurService],
})
export class UtilisateurModule {}
