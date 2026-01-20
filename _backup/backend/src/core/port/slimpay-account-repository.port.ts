import { SlimpayAccountEntity } from '../domain/slimpay-account.entity';
import { BaseRepositoryPort } from './repository.port';

export interface SlimpayAccountRepositoryPort extends BaseRepositoryPort<SlimpayAccountEntity> {
  findBySocieteId(societeId: string): Promise<SlimpayAccountEntity | null>;
  findAllActive(): Promise<SlimpayAccountEntity[]>;
}
