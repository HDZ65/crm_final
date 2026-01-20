import { BaseEntity } from './base.entity';
import { PaymentEventType } from './payment.enums';

export interface PaymentEventProps {
  id?: string;
  pspEventId: string;
  organisationId: string;
  paymentIntentId: string;
  eventType: PaymentEventType;
  rawPayload: Record<string, any>;
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentEventEntity extends BaseEntity {
  pspEventId: string;
  organisationId: string;
  paymentIntentId: string;
  eventType: PaymentEventType;
  rawPayload: Record<string, any>;
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date | null;
  errorMessage?: string | null;

  constructor(props: PaymentEventProps) {
    super(props);
    this.pspEventId = props.pspEventId;
    this.organisationId = props.organisationId;
    this.paymentIntentId = props.paymentIntentId;
    this.eventType = props.eventType;
    this.rawPayload = props.rawPayload;
    this.receivedAt = props.receivedAt;
    this.processed = props.processed;
    this.processedAt = props.processedAt ?? null;
    this.errorMessage = props.errorMessage ?? null;
  }

  isProcessed(): boolean {
    return this.processed;
  }

  markAsProcessed(): void {
    this.processed = true;
    this.processedAt = new Date();
  }

  isConfirmed(): boolean {
    return this.eventType === PaymentEventType.PAYMENT_CONFIRMED;
  }

  isFailed(): boolean {
    return this.eventType === PaymentEventType.PAYMENT_FAILED;
  }
}
