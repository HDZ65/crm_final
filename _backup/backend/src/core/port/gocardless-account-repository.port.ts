import { GoCardlessAccountEntity } from '../domain/gocardless-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface GoCardlessAccountRepositoryPort extends BaseRepositoryPort<GoCardlessAccountEntity> {
  findBySocieteId(societeId: string): Promise<GoCardlessAccountEntity | null>;
  findAllActive(): Promise<GoCardlessAccountEntity[]>;
}
