import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { KeycloakModule } from './keycloak.module';
import { KeycloakSyncGuard } from './guards/keycloak-sync.guard';
import { AuthSyncService } from '../../services/auth-sync.service';
import { TypeOrmUtilisateurRepository } from '../../repositories/typeorm-utilisateur.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateurEntity } from '../../db/entities/utilisateur.entity';

// Security Configuration
// WARNING: ENABLE_SECURITY should be set to 'true' in production!
const ENABLE_SECURITY = process.env.ENABLE_SECURITY === 'true';

if (!ENABLE_SECURITY) {
  console.warn(
    '\x1b[33m⚠️  WARNING: Security is DISABLED. Set ENABLE_SECURITY=true in production!\x1b[0m',
  );
}

@Module({
  imports: [KeycloakModule, TypeOrmModule.forFeature([UtilisateurEntity])],
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
