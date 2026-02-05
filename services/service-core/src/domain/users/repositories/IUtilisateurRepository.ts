import { UtilisateurEntity } from '../entities/utilisateur.entity';

export interface IUtilisateurRepository {
  findById(id: string): Promise<UtilisateurEntity | null>;
  findAll(): Promise<UtilisateurEntity[]>;
  save(entity: UtilisateurEntity): Promise<UtilisateurEntity>;
  delete(id: string): Promise<void>;
  findByEmail(email: string): Promise<UtilisateurEntity | null>;
  findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null>;
}
