import { StatutPartenaireEntity } from '../entities/statut-partenaire.entity';

export interface IStatutPartenaireRepository {
  findById(id: string): Promise<StatutPartenaireEntity | null>;
  findAll(): Promise<StatutPartenaireEntity[]>;
  save(entity: StatutPartenaireEntity): Promise<StatutPartenaireEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<StatutPartenaireEntity | null>;
}
