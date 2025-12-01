import { ApporteurEntity } from '../domain/apporteur.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ApporteurRepositoryPort
  extends BaseRepositoryPort<ApporteurEntity> {
  findByOrganisationId(organisationId: string): Promise<ApporteurEntity[]>;
  findByUtilisateurId(utilisateurId: string): Promise<ApporteurEntity | null>;
}
