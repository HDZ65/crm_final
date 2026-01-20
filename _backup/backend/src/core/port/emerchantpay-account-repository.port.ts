import { EmerchantpayAccountEntity } from '../domain/emerchantpay-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface EmerchantpayAccountRepositoryPort extends BaseRepositoryPort<EmerchantpayAccountEntity> {
  findBySocieteId(societeId: string): Promise<EmerchantpayAccountEntity | null>;
  findAllActive(): Promise<EmerchantpayAccountEntity[]>;
}
