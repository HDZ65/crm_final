import { GoCardlessMandateEntity } from '../domain/gocardless-mandate.entity';
import { BaseRepositoryPort } from './repository.port';

export interface GoCardlessMandateRepositoryPort
  extends BaseRepositoryPort<GoCardlessMandateEntity> {
  findByClientId(clientId: string): Promise<GoCardlessMandateEntity[]>;
  findByMandateId(mandateId: string): Promise<GoCardlessMandateEntity | null>;
  findByGocardlessCustomerId(
    gocardlessCustomerId: string,
  ): Promise<GoCardlessMandateEntity[]>;
  findActiveByClientId(clientId: string): Promise<GoCardlessMandateEntity | null>;
  findBySubscriptionId(
    subscriptionId: string,
  ): Promise<GoCardlessMandateEntity | null>;
}
