import { MultisafepayAccountEntity } from '../domain/multisafepay-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface MultisafepayAccountRepositoryPort extends BaseRepositoryPort<MultisafepayAccountEntity> {
  findBySocieteId(societeId: string): Promise<MultisafepayAccountEntity | null>;
  findAllActive(): Promise<MultisafepayAccountEntity[]>;
}
