import { StripeAccountEntity } from '../domain/stripe-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface StripeAccountRepositoryPort extends BaseRepositoryPort<StripeAccountEntity> {
  findBySocieteId(societeId: string): Promise<StripeAccountEntity | null>;
  findAllActive(): Promise<StripeAccountEntity[]>;
}
