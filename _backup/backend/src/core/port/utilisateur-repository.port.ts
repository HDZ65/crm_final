import { UtilisateurEntity } from '../domain/utilisateur.entity';
import { BaseRepositoryPort } from './repository.port';

export interface UtilisateurRepositoryPort extends BaseRepositoryPort<UtilisateurEntity> {
  findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null>;
}
