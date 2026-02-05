import { ClientPartenaireEntity } from '../entities/client-partenaire.entity';

export interface IClientPartenaireRepository {
  findById(id: string): Promise<ClientPartenaireEntity | null>;
  findAll(): Promise<ClientPartenaireEntity[]>;
  save(entity: ClientPartenaireEntity): Promise<ClientPartenaireEntity>;
  delete(id: string): Promise<void>;
  findByClientBaseId(clientBaseId: string): Promise<ClientPartenaireEntity[]>;
  findByPartenaireId(partenaireId: string): Promise<ClientPartenaireEntity[]>;
}
