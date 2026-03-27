import { StatutContratEntity } from '../entities/statut-contrat.entity';

export interface IStatutContratRepository {
  findById(id: string): Promise<StatutContratEntity | null>;
  findByCode(code: string): Promise<StatutContratEntity | null>;
  findAll(): Promise<StatutContratEntity[]>;
  save(entity: StatutContratEntity): Promise<StatutContratEntity>;
  delete(id: string): Promise<void>;
}
