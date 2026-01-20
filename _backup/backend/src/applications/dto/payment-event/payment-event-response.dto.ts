import { PaymentEventType } from '../../../core/domain/payment.enums';

export class PaymentEventResponseDto {
  id: string;
  organisationId: string;
  paymentIntentId: string;
  eventType: PaymentEventType;
  rawPayload: Record<string, any>;
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
