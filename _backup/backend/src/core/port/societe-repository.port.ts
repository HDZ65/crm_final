import { SocieteEntity } from '../domain/societe.entity';
import { BaseRepositoryPort } from './repository.port';

export interface SocieteRepositoryPort extends BaseRepositoryPort<SocieteEntity> {
  findByOrganisationId(organisationId: string): Promise<SocieteEntity[]>;
}
