import { ClientBaseEntity } from '../entities/client-base.entity';

export interface IClientBaseRepository {
  findById(id: string): Promise<ClientBaseEntity | null>;
  findAll(): Promise<ClientBaseEntity[]>;
  save(entity: ClientBaseEntity): Promise<ClientBaseEntity>;
  delete(id: string): Promise<void>;
  findByOrganisationId(organisationId: string): Promise<ClientBaseEntity[]>;
  findByPartenaireId(partenaireId: string): Promise<ClientBaseEntity[]>;
}
