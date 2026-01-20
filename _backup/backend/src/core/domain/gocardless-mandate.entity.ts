import { BaseEntity } from './base.entity';

export type GoCardlessMandateStatus =
  | 'pending_customer_approval'
  | 'pending_submission'
  | 'submitted'
  | 'active'
  | 'cancelled'
  | 'failed'
  | 'expired';

export type GoCardlessScheme =
  | 'sepa_core'
  | 'sepa_cor1'
  | 'bacs'
  | 'autogiro'
  | 'becs'
  | 'becs_nz'
  | 'betalingsservice'
  | 'pad';

export class GoCardlessMandateEntity extends BaseEntity {
  clientId: string;
  gocardlessCustomerId: string;
  gocardlessBankAccountId?: string;
  mandateId: string;
  mandateReference?: string;
  mandateStatus: GoCardlessMandateStatus;
  scheme: GoCardlessScheme;
  subscriptionId?: string;
  subscriptionStatus?: string;
  nextChargeDate?: Date;
  metadata?: Record<string, string>;

  constructor(partial?: Partial<GoCardlessMandateEntity>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }

  isActive(): boolean {
    return this.mandateStatus === 'active';
  }

  canCollectPayment(): boolean {
    return this.mandateStatus === 'active';
  }

  hasSubscription(): boolean {
    return !!this.subscriptionId;
  }
}
