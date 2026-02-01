import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateurEntity } from './entities/utilisateur.entity';
import { UtilisateurService } from './utilisateur.service';
import { UtilisateurController } from './utilisateur.controller';
import { AuthSyncModule } from '../auth-sync/auth-sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UtilisateurEntity]),
    forwardRef(() => AuthSyncModule),
  ],
  controllers: [UtilisateurController],
  providers: [UtilisateurService],
  exports: [UtilisateurService],
})
export class UtilisateurModule {}
