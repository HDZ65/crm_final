import { GoCardlessMandateEntity } from '../../../core/domain/gocardless-mandate.entity';

export class GoCardlessMandateDto {
  id: string;
  clientId: string;
  gocardlessCustomerId: string;
  gocardlessBankAccountId?: string;
  mandateId: string;
  mandateReference?: string;
  mandateStatus: string;
  scheme: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  nextChargeDate?: Date;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;

  constructor(entity: GoCardlessMandateEntity) {
    this.id = entity.id;
    this.clientId = entity.clientId;
    this.gocardlessCustomerId = entity.gocardlessCustomerId;
    this.gocardlessBankAccountId = entity.gocardlessBankAccountId;
    this.mandateId = entity.mandateId;
    this.mandateReference = entity.mandateReference;
    this.mandateStatus = entity.mandateStatus;
    this.scheme = entity.scheme;
    this.subscriptionId = entity.subscriptionId;
    this.subscriptionStatus = entity.subscriptionStatus;
    this.nextChargeDate = entity.nextChargeDate;
    this.metadata = entity.metadata;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
