import { MembreCompteEntity } from '../domain/membre-compte.entity';
import { BaseRepositoryPort } from './repository.port';

export interface MembreCompteRepositoryPort
  extends BaseRepositoryPort<MembreCompteEntity> {
  findByOrganisationId(organisationId: string): Promise<MembreCompteEntity[]>;
}
