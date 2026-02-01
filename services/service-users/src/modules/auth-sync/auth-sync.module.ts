import { Module, forwardRef } from '@nestjs/common';
import { AuthSyncService } from './auth-sync.service';
import { AuthSyncController } from './auth-sync.controller';
import { UtilisateurModule } from '../utilisateur/utilisateur.module';
import { MembreCompteModule } from '../membre-compte/membre-compte.module';
import { CompteModule } from '../compte/compte.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    forwardRef(() => UtilisateurModule),
    forwardRef(() => MembreCompteModule),
    forwardRef(() => CompteModule),
    RoleModule,
  ],
  controllers: [AuthSyncController],
  providers: [AuthSyncService],
  exports: [AuthSyncService],
})
export class AuthSyncModule {}
