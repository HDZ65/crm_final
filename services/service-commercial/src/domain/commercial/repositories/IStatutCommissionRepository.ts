import { StatutCommissionEntity } from '../entities/statut-commission.entity';

export interface IStatutCommissionRepository {
  findById(id: string): Promise<StatutCommissionEntity | null>;
  findByCode(code: string): Promise<StatutCommissionEntity | null>;
  findAll(): Promise<StatutCommissionEntity[]>;
  save(entity: StatutCommissionEntity): Promise<StatutCommissionEntity>;
  delete(id: string): Promise<void>;
}
