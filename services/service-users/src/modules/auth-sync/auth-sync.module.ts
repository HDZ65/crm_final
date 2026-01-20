import { Module } from '@nestjs/common';
import { AuthSyncService } from './auth-sync.service';
import { UtilisateurModule } from '../utilisateur/utilisateur.module';
import { MembreCompteModule } from '../membre-compte/membre-compte.module';
import { CompteModule } from '../compte/compte.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [UtilisateurModule, MembreCompteModule, CompteModule, RoleModule],
  providers: [AuthSyncService],
  exports: [AuthSyncService],
})
export class AuthSyncModule {}
