import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { AuthSyncService, KeycloakUser } from '../../../services/auth-sync.service';

/**
 * Guard qui synchronise automatiquement l'utilisateur Keycloak avec la base de données
 * Ce guard s'exécute après l'authentification Keycloak et avant le contrôleur
 * Il ajoute l'utilisateur synchronisé dans request.user.dbUser
 */
@Injectable()
export class KeycloakSyncGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakSyncGuard.name);

  constructor(private readonly authSyncService: AuthSyncService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const keycloakUser = request.user;

    // Si pas d'utilisateur Keycloak (route publique), laisser passer
    if (!keycloakUser || !keycloakUser.sub) {
      this.logger.log('KeycloakSyncGuard: Pas d\'utilisateur Keycloak, route publique ou non authentifiée');
      return true;
    }

    this.logger.log(`KeycloakSyncGuard: Synchronisation pour keycloakId: ${keycloakUser.sub}`);

    try {
      // Synchroniser l'utilisateur avec la base de données
      const dbUser = await this.authSyncService.syncKeycloakUser(keycloakUser as KeycloakUser);

      // Ajouter l'utilisateur de la BDD dans la requête pour usage dans les contrôleurs
      request.user.dbUser = dbUser;

      this.logger.log(`Utilisateur synchronisé: ${dbUser.email} (id: ${dbUser.id})`);

      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de la synchronisation de l'utilisateur: ${error.message}`, error.stack);
      // Ne pas bloquer la requête en cas d'erreur de sync
      return true;
    }
  }
}
