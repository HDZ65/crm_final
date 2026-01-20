import { StatutCommissionEntity } from '../domain/statut-commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface StatutCommissionRepositoryPort extends BaseRepositoryPort<StatutCommissionEntity> {
  findByCode(code: string): Promise<StatutCommissionEntity | null>;
}
