export enum ScheduleStatus {
  PLANNED = 'planned',
  PROCESSING = 'processing',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  UNPAID = 'unpaid',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired', // Contract expired, needs explicit renewal
}

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_PENDING = 'payment_pending',
  MANDATE_CANCELLED = 'mandate_cancelled',
  PAYMENT_REFUNDED = 'payment_refunded',
}

export enum PSPName {
  GOCARDLESS = 'gocardless',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
  EMERCHANTPAY = 'emerchantpay',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}
