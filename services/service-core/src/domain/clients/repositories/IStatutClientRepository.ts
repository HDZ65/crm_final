import { StatutClientEntity } from '../entities/statut-client.entity';

export interface IStatutClientRepository {
  findById(id: string): Promise<StatutClientEntity | null>;
  findAll(): Promise<StatutClientEntity[]>;
  save(entity: StatutClientEntity): Promise<StatutClientEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<StatutClientEntity | null>;
}
