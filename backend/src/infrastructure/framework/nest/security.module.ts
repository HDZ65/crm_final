import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { KeycloakModule } from './keycloak.module';
import { KeycloakSyncGuard } from './guards/keycloak-sync.guard';
import { AuthSyncService } from '../../services/auth-sync.service';
import { TypeOrmUtilisateurRepository } from '../../repositories/typeorm-utilisateur.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateurEntity } from '../../db/entities/utilisateur.entity';

// TODO: En production, réactiver les guards globaux
// Pour le développement, les guards sont désactivés pour permettre un accès sans authentification
const ENABLE_SECURITY = process.env.ENABLE_SECURITY === 'true';

@Module({
  imports: [
    KeycloakModule,
    TypeOrmModule.forFeature([UtilisateurEntity]),
  ],
  providers: [
    AuthSyncService,
    {
      provide: 'UtilisateurRepositoryPort',
      useClass: TypeOrmUtilisateurRepository,
    },
    ...(ENABLE_SECURITY
      ? [
          { provide: APP_GUARD, useClass: AuthGuard },
          { provide: APP_GUARD, useClass: RoleGuard },
          { provide: APP_GUARD, useClass: KeycloakSyncGuard },
        ]
      : []),
  ],
  exports: [AuthSyncService],
})
export class SecurityModule {}
