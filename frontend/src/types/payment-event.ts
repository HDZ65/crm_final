export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_PENDING = 'payment_pending',
  MANDATE_CANCELLED = 'mandate_cancelled',
  PAYMENT_REFUNDED = 'payment_refunded',
}

export interface PaymentEvent {
  id: string;
  organisationId: string;
  paymentIntentId: string;
  eventType: PaymentEventType;
  rawPayload: Record<string, any>;
  receivedAt: string;
  processed: boolean;
  processedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentEventDto {
  organisationId: string;
  paymentIntentId: string;
  eventType: PaymentEventType;
  rawPayload: Record<string, any>;
  receivedAt?: string;
  processed?: boolean;
}

export interface UpdatePaymentEventDto {
  processed?: boolean;
  processedAt?: string;
  errorMessage?: string;
}
