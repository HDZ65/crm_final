// Types pour l'intégration GoCardless

// === Mandate Types ===
export type MandateStatus =
  | "pending_customer_approval"
  | "pending_submission"
  | "submitted"
  | "active"
  | "cancelled"
  | "failed"
  | "expired"

export interface GocardlessMandate {
  id: string
  gocardlessMandateId: string
  gocardlessCustomerId: string
  clientId: string
  mandateReference: string
  mandateStatus: MandateStatus
  scheme: string
  bankAccountEndingIn?: string
  createdAt: string
  updatedAt: string
}

// === Payment Types ===
export type PaymentStatus =
  | "pending_customer_approval"
  | "pending_submission"
  | "submitted"
  | "confirmed"
  | "paid_out"
  | "cancelled"
  | "customer_approval_denied"
  | "failed"
  | "charged_back"

export interface GocardlessPayment {
  id: string
  gocardlessPaymentId: string
  mandateId: string
  amount: number
  currency: string
  status: PaymentStatus
  chargeDate?: string
  reference?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// === Subscription Types ===
export type SubscriptionStatus =
  | "pending_customer_approval"
  | "customer_approval_denied"
  | "active"
  | "finished"
  | "cancelled"
  | "paused"

export type IntervalUnit = "weekly" | "monthly" | "yearly"

export interface GocardlessSubscription {
  id: string
  gocardlessSubscriptionId: string
  mandateId: string
  amount: number
  currency: string
  name?: string
  status: SubscriptionStatus
  intervalUnit: IntervalUnit
  interval: number
  dayOfMonth?: number
  startDate?: string
  endDate?: string
  upcomingPayments?: Array<{
    chargeDate: string
    amount: number
  }>
  createdAt: string
  updatedAt: string
}

// === Request/Response DTOs ===
export interface SetupMandateRequest {
  clientId: string
  redirectUri: string
  exitUri: string
  currency?: string
  scheme?: string
  prefillCustomer?: {
    email?: string
    givenName?: string
    familyName?: string
    companyName?: string
    addressLine1?: string
    city?: string
    postalCode?: string
    countryCode?: string
  }
}

export interface SetupMandateResponse {
  billingRequestId: string
  billingRequestFlowId: string
  authorisationUrl: string
}

export interface CreatePaymentRequest {
  amount: number // En centimes (2500 = 25.00 EUR)
  currency?: string
  reference?: string
  description?: string
  chargeDate?: string // YYYY-MM-DD
}

export interface CreateSubscriptionRequest {
  amount: number // En centimes
  currency?: string
  name?: string
  intervalUnit?: IntervalUnit
  interval?: number
  dayOfMonth?: number // 1-28
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
}

// === Webhook Event Types ===
export type WebhookEventType =
  | "mandates"
  | "payments"
  | "subscriptions"
  | "billing_requests"
  | "instalment_schedules"

export type WebhookAction =
  | "created"
  | "customer_approval_granted"
  | "customer_approval_denied"
  | "submitted"
  | "active"
  | "cancelled"
  | "failed"
  | "expired"
  | "resubmission_requested"
  | "confirmed"
  | "paid_out"
  | "late_failure_settled"
  | "charged_back"
  | "fulfilled"
  | "finished"
  | "paused"
  | "resumed"

export interface GocardlessWebhookEvent {
  id: string
  gocardlessEventId: string
  resourceType: WebhookEventType
  action: WebhookAction
  resourceId: string
  processedAt?: string
  createdAt: string
}

// === UI Helper Types ===
export interface MandateStatusConfig {
  label: string
  color: "green" | "orange" | "gray" | "red"
  icon: string
  showReconfigure?: boolean
}

export const MANDATE_STATUS_CONFIG: Record<MandateStatus, MandateStatusConfig> = {
  pending_customer_approval: {
    label: "En attente d'approbation",
    color: "orange",
    icon: "clock",
  },
  pending_submission: {
    label: "En cours de traitement",
    color: "orange",
    icon: "loader",
  },
  submitted: {
    label: "En cours de validation",
    color: "orange",
    icon: "send",
  },
  active: {
    label: "Actif",
    color: "green",
    icon: "check-circle",
  },
  cancelled: {
    label: "Annulé",
    color: "gray",
    icon: "x-circle",
    showReconfigure: true,
  },
  failed: {
    label: "Échec",
    color: "red",
    icon: "alert-circle",
    showReconfigure: true,
  },
  expired: {
    label: "Expiré",
    color: "red",
    icon: "clock",
    showReconfigure: true,
  },
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending_customer_approval: { label: "En attente d'approbation", color: "orange" },
  pending_submission: { label: "En attente d'envoi", color: "orange" },
  submitted: { label: "Envoyé", color: "blue" },
  confirmed: { label: "Confirmé", color: "green" },
  paid_out: { label: "Versé", color: "green" },
  cancelled: { label: "Annulé", color: "gray" },
  customer_approval_denied: { label: "Refusé", color: "red" },
  failed: { label: "Échec", color: "red" },
  charged_back: { label: "Remboursé", color: "red" },
}
