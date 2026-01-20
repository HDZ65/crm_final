export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PSPName {
  GOCARDLESS = 'gocardless',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
  EMERCHANTPAY = 'emerchantpay',
  STRIPE = 'stripe',
}

export interface PaymentIntent {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentDto {
  organisationId: string;
  scheduleId: string;
  societeId?: string;
  pspName: PSPName;
  pspPaymentId?: string;
  amount: number;
  currency?: string;
  status?: PaymentIntentStatus;
  idempotencyKey: string;
  mandateReference?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentIntentDto {
  societeId?: string;
  pspPaymentId?: string;
  status?: PaymentIntentStatus;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}
