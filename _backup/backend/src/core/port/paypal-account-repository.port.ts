import { PaypalAccountEntity } from '../domain/paypal-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface PaypalAccountRepositoryPort extends BaseRepositoryPort<PaypalAccountEntity> {
  findBySocieteId(societeId: string): Promise<PaypalAccountEntity | null>;
  findAllActive(): Promise<PaypalAccountEntity[]>;
}
