import { Injectable, Inject, Logger } from '@nestjs/common';
import type { UtilisateurRepositoryPort } from '../../core/port/utilisateur-repository.port';
import { UtilisateurEntity } from '../../core/domain/utilisateur.entity';

export interface KeycloakUser {
  sub: string; // Keycloak user ID
  email?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  name?: string;
}

@Injectable()
export class AuthSyncService {
  private readonly logger = new Logger(AuthSyncService.name);

  constructor(
    @Inject('UtilisateurRepositoryPort')
    private readonly utilisateurRepository: UtilisateurRepositoryPort,
  ) {}

  /**
   * Synchronise un utilisateur Keycloak avec la base de données
   * Si l'utilisateur existe déjà (par keycloakId), il est retourné
   * Sinon, il est créé avec les informations du token Keycloak
   */
  async syncKeycloakUser(keycloakUser: KeycloakUser): Promise<UtilisateurEntity> {
    const keycloakId = keycloakUser.sub;

    // Vérifier si l'utilisateur existe déjà
    let utilisateur = await this.utilisateurRepository.findByKeycloakId(keycloakId);

    if (utilisateur) {
      this.logger.log(`Utilisateur existant trouvé: ${utilisateur.email} (keycloakId: ${keycloakId})`);
      return utilisateur;
    }

    // Créer un nouvel utilisateur
    this.logger.log(`Création d'un nouvel utilisateur pour keycloakId: ${keycloakId}`);

    const newUtilisateur = new UtilisateurEntity({
      keycloakId: keycloakId,
      email: keycloakUser.email || keycloakUser.preferred_username || '',
      prenom: keycloakUser.given_name || '',
      nom: keycloakUser.family_name || keycloakUser.name || '',
      telephone: '', // À compléter ultérieurement par l'utilisateur
      actif: true,
    });

    utilisateur = await this.utilisateurRepository.create(newUtilisateur);
    this.logger.log(`Nouvel utilisateur créé: ${utilisateur.email} (id: ${utilisateur.id})`);

    return utilisateur;
  }

  /**
   * Recherche un utilisateur par son keycloakId
   */
  async findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null> {
    return this.utilisateurRepository.findByKeycloakId(keycloakId);
  }
}
