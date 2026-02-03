import { Injectable, Logger } from '@nestjs/common';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { MembreCompteService } from '../membre-compte/membre-compte.service';
import { CompteService } from '../compte/compte.service';
import { RoleService } from '../role/role.service';
import { UtilisateurEntity } from '../utilisateur/entities/utilisateur.entity';
import type { SyncKeycloakUserRequest } from '@crm/proto/users';

/**
 * Interface for Keycloak user data with snake_case properties (OIDC standard)
 * Used by controllers to build the user object before syncing
 */
export interface KeycloakUser {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  name?: string;
}

export interface UserProfile {
  utilisateur: UtilisateurEntity;
  organisations: Array<{
    organisationId: string;
    organisationNom: string;
    role: { id: string; code: string; nom: string };
    etat: string;
  }>;
  hasOrganisation: boolean;
}

@Injectable()
export class AuthSyncService {
  private readonly logger = new Logger(AuthSyncService.name);

  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly membreCompteService: MembreCompteService,
    private readonly compteService: CompteService,
    private readonly roleService: RoleService,
  ) {}

  async syncKeycloakUser(keycloakUser: KeycloakUser | SyncKeycloakUserRequest): Promise<UtilisateurEntity> {
    this.logger.log(`Syncing Keycloak user: ${keycloakUser.sub} (${keycloakUser.email})`);

    // Check if user already exists
    let user = await this.utilisateurService.findByKeycloakId(keycloakUser.sub);

    if (user) {
      this.logger.log(`User ${keycloakUser.sub} already exists in database`);
      return user;
    }

    // Handle both snake_case (KeycloakUser) and snake_case (SyncKeycloakUserRequest) formats
    const familyName = 'family_name' in keycloakUser ? keycloakUser.family_name : (keycloakUser as SyncKeycloakUserRequest).family_name;
    const givenName = 'given_name' in keycloakUser ? keycloakUser.given_name : (keycloakUser as SyncKeycloakUserRequest).given_name;

    // Parse name from Keycloak claims
    const nom = familyName || this.extractLastName(keycloakUser.name) || keycloakUser.email.split('@')[0];
    const prenom = givenName || this.extractFirstName(keycloakUser.name) || '';

    // Create new user
    user = await this.utilisateurService.create({
      keycloakId: keycloakUser.sub,
      nom,
      prenom,
      email: keycloakUser.email,
      actif: true,
    });

    this.logger.log(`Created new user: ${user.id} for Keycloak user ${keycloakUser.sub}`);
    return user;
  }

  async findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null> {
    return this.utilisateurService.findByKeycloakId(keycloakId);
  }

  async getUserProfile(keycloakId: string): Promise<UserProfile | null> {
    const utilisateur = await this.utilisateurService.findByKeycloakId(keycloakId);
    if (!utilisateur) {
      return null;
    }

    const { membres } = await this.membreCompteService.findByUtilisateur(utilisateur.id);

    const organisations = await Promise.all(
      membres.map(async (membre) => {
        let organisationNom = 'Unknown';
        try {
          const compte = await this.compteService.findById(membre.organisationId);
          organisationNom = compte.nom;
        } catch {
          this.logger.warn(`Could not find organisation ${membre.organisationId}`);
        }

        return {
          organisationId: membre.organisationId,
          organisationNom,
          role: {
            id: membre.role?.id || membre.roleId,
            code: membre.role?.code || 'unknown',
            nom: membre.role?.nom || 'Unknown',
          },
          etat: membre.etat,
        };
      }),
    );

    return {
      utilisateur,
      organisations,
      hasOrganisation: organisations.length > 0,
    };
  }

  private extractFirstName(fullName?: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  }

  private extractLastName(fullName?: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(1).join(' ') || '';
  }
}
