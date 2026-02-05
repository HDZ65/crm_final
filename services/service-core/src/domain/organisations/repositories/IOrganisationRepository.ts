import { OrganisationEntity } from '../entities/organisation.entity';

export interface IOrganisationRepository {
  findById(id: string): Promise<OrganisationEntity | null>;
  findAll(): Promise<OrganisationEntity[]>;
  save(entity: OrganisationEntity): Promise<OrganisationEntity>;
  delete(id: string): Promise<void>;
}
