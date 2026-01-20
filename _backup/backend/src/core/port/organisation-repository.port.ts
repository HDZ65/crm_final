import { OrganisationEntity } from '../domain/organisation.entity';
import { BaseRepositoryPort } from './repository.port';

export interface OrganisationRepositoryPort extends BaseRepositoryPort<OrganisationEntity> {}
