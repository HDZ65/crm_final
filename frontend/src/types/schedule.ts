export enum ScheduleStatus {
  PLANNED = 'planned',
  PROCESSING = 'processing',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  UNPAID = 'unpaid',
  CANCELLED = 'cancelled',
}

export enum PSPName {
  STRIPE = 'STRIPE',
  GOCARDLESS = 'GOCARDLESS',
  SLIMPAY = 'SLIMPAY',
  MULTISAFEPAY = 'MULTISAFEPAY',
  EMERCHANTPAY = 'EMERCHANTPAY',
}

export type IntervalUnit = 'day' | 'week' | 'month' | 'year';

export interface Schedule {
  id: string;
  organisationId: string;
  factureId?: string | null;
  contratId?: string | null;
  societeId?: string | null;
  clientId?: string | null;
  produitId?: string | null;

  // Payment info
  pspName: PSPName;
  amount: number;
  currency: string;

  // Scheduling
  dueDate: string;
  nextDueDate?: string | null;
  isRecurring: boolean;
  intervalUnit?: IntervalUnit | null;
  intervalCount?: number | null;

  // Status
  status: ScheduleStatus;
  retryCount: number;
  maxRetries: number;
  lastFailureAt?: string | null;
  lastFailureReason?: string | null;

  // PSP references
  pspMandateId?: string | null;
  pspCustomerId?: string | null;

  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDto {
  organisationId: string;
  factureId?: string;
  contratId?: string;
  societeId?: string;
  clientId?: string;
  produitId?: string;

  // Payment info
  pspName: PSPName;
  amount: number;
  currency?: string;

  // Scheduling
  dueDate: string;
  isRecurring?: boolean;
  intervalUnit?: IntervalUnit;
  intervalCount?: number;

  // Status
  status?: ScheduleStatus;
  maxRetries?: number;

  // PSP references
  pspMandateId?: string;
  pspCustomerId?: string;

  metadata?: Record<string, any>;
}

export interface UpdateScheduleDto {
  societeId?: string;
  clientId?: string;
  produitId?: string;
  pspName?: PSPName;
  amount?: number;
  currency?: string;
  dueDate?: string;
  nextDueDate?: string;
  isRecurring?: boolean;
  intervalUnit?: IntervalUnit;
  intervalCount?: number;
  status?: ScheduleStatus;
  retryCount?: number;
  maxRetries?: number;
  lastFailureAt?: string;
  lastFailureReason?: string;
  pspMandateId?: string;
  pspCustomerId?: string;
  metadata?: Record<string, any>;
}
