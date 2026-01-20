import { BaseEntity } from './base.entity';
import { PaymentIntentStatus, PSPName } from './payment.enums';

export interface PaymentIntentProps {
  id?: string;
  organisationId: string;
  scheduleId: string;
  societeId?: string | null;
  pspName: PSPName;
  pspPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  idempotencyKey: string;
  mandateReference?: string | null;
  metadata?: Record<string, any> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentIntentEntity extends BaseEntity {
  organisationId: string;
  scheduleId: string;
  societeId?: string | null;
  pspName: PSPName;
  pspPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  idempotencyKey: string;
  mandateReference?: string | null;
  metadata?: Record<string, any> | null;
  errorCode?: string | null;
  errorMessage?: string | null;

  constructor(props: PaymentIntentProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.scheduleId = props.scheduleId;
    this.societeId = props.societeId ?? null;
    this.pspName = props.pspName;
    this.pspPaymentId = props.pspPaymentId ?? null;
    this.amount = props.amount;
    this.currency = props.currency;
    this.status = props.status;
    this.idempotencyKey = props.idempotencyKey;
    this.mandateReference = props.mandateReference ?? null;
    this.metadata = props.metadata ?? null;
    this.errorCode = props.errorCode ?? null;
    this.errorMessage = props.errorMessage ?? null;
  }

  isPending(): boolean {
    return this.status === PaymentIntentStatus.PENDING;
  }

  isSucceeded(): boolean {
    return this.status === PaymentIntentStatus.SUCCEEDED;
  }

  isFailed(): boolean {
    return this.status === PaymentIntentStatus.FAILED;
  }

  canRetry(): boolean {
    return this.isFailed();
  }
}
