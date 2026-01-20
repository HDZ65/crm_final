import { StatutClientEntity } from '../domain/statut-client.entity';
import { BaseRepositoryPort } from './repository.port';

export interface StatutClientRepositoryPort extends BaseRepositoryPort<StatutClientEntity> {
  findByCode(code: string): Promise<StatutClientEntity | null>;
}
