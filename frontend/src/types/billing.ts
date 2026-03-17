/**
 * Types for Billing entities (Payments, Schedules, PSP Accounts)
 * Aligned with proto types and backend entities
 */

import { z } from 'zod'

// ============================================
// Enums (from proto & backend)
// ============================================

export enum PaymentStatus {
  PENDING = 'PAYMENT_STATUS_PENDING',
  SUBMITTED = 'PAYMENT_STATUS_SUBMITTED',
  PAID = 'PAYMENT_STATUS_PAID',
  REJECTED = 'PAYMENT_STATUS_REJECTED',
  REFUNDED = 'PAYMENT_STATUS_REFUNDED',
  CANCELLED = 'PAYMENT_STATUS_CANCELLED',
  FAILED = 'PAYMENT_STATUS_FAILED',
}

export enum ScheduleStatus {
  ACTIVE = 'SCHEDULE_STATUS_ACTIVE',
  PAUSED = 'SCHEDULE_STATUS_PAUSED',
  CANCELLED = 'SCHEDULE_STATUS_CANCELLED',
  COMPLETED = 'SCHEDULE_STATUS_COMPLETED',
}

export enum ScheduleFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  GOCARDLESS = 'gocardless',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
  EMERCHANTPAY = 'emerchantpay',
}

// ============================================
// Display Types (for UI rendering)
// ============================================

/**
 * Payment display type for tables and detail views
 * Flattened from PaymentIntentEntity for frontend consumption
 */
export interface PaymentDisplay {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  clientName: string
  createdAt: string
  updatedAt: string
  failureReason?: string
  refundedAmount?: number
  paidAt?: string
}

/**
 * Schedule display type for recurring payment management
 * Flattened from ScheduleEntity for frontend consumption
 */
export interface ScheduleDisplay {
  id: string
  clientId: string
  frequency: ScheduleFrequency
  status: ScheduleStatus
  nextPaymentDate: string
  amount: number
  currency: string
  provider: PaymentProvider
  startDate: string
  endDate?: string
  retryCount: number
  maxRetries: number
  createdAt: string
  updatedAt: string
}

/**
 * Payment statistics for dashboard KPIs
 */
export interface PaymentStats {
  totalAmount: number
  totalCount: number
  successRate: number // 0-100
  pendingAmount: number
  failedCount: number
  refundedAmount: number
  averageAmount: number
}

/**
 * PSP Account summary for configuration UI
 */
export interface PSPAccountSummary {
  provider: PaymentProvider
  isConnected: boolean
  isLiveMode?: boolean
  lastTestedAt?: string
  environment?: 'sandbox' | 'live'
}

// ============================================
// Filter & Search Types
// ============================================

/**
 * Zod schema for payment filters
 * Used in payment list views and API queries
 */
export const PaymentFiltersSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  provider: z.nativeEnum(PaymentProvider).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  clientId: z.string().uuid().optional(),
  searchText: z.string().optional(),
})

export type PaymentFilters = z.infer<typeof PaymentFiltersSchema>

/**
 * Zod schema for date range filtering
 * Reusable for any date-based filtering
 */
export const DateRangeFilterSchema = z.object({
  from: z.string().datetime('ISO 8601 datetime required'),
  to: z.string().datetime('ISO 8601 datetime required'),
})

export type DateRangeFilter = z.infer<typeof DateRangeFilterSchema>

/**
 * Zod schema for schedule filters
 */
export const ScheduleFiltersSchema = z.object({
  status: z.nativeEnum(ScheduleStatus).optional(),
  provider: z.nativeEnum(PaymentProvider).optional(),
  frequency: z.nativeEnum(ScheduleFrequency).optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type ScheduleFilters = z.infer<typeof ScheduleFiltersSchema>

// ============================================
// Request/Response Types
// ============================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Payment list response
 */
export interface PaymentListResponse {
  payments: PaymentDisplay[]
  pagination: PaginationMeta
}

/**
 * Schedule list response
 */
export interface ScheduleListResponse {
  schedules: ScheduleDisplay[]
  pagination: PaginationMeta
}

/**
 * PSP accounts summary response
 */
export interface PSPAccountsSummaryResponse {
  stripe?: PSPAccountSummary
  paypal?: PSPAccountSummary
  gocardless?: PSPAccountSummary
  slimpay?: PSPAccountSummary
  multisafepay?: PSPAccountSummary
  emerchantpay?: PSPAccountSummary
}

// ============================================
// Validation Schemas
// ============================================

/**
 * Schema for creating a payment intent
 */
export const CreatePaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  provider: z.nativeEnum(PaymentProvider),
  clientId: z.string().uuid(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>

/**
 * Schema for creating a schedule
 */
export const CreateScheduleSchema = z.object({
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  frequency: z.nativeEnum(ScheduleFrequency),
  provider: z.nativeEnum(PaymentProvider),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  description: z.string().optional(),
})

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>

/**
 * Schema for updating a schedule
 */
export const UpdateScheduleSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ScheduleStatus).optional(),
  amount: z.number().positive().optional(),
  frequency: z.nativeEnum(ScheduleFrequency).optional(),
  endDate: z.string().datetime().optional(),
})

export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>

// ============================================
// UI Component Props Types
// ============================================

/**
 * Props for payment table component
 */
export interface PaymentTableProps {
  payments: PaymentDisplay[]
  isLoading?: boolean
  onRowClick?: (payment: PaymentDisplay) => void
  onRefund?: (paymentId: string) => void
}

/**
 * Props for schedule table component
 */
export interface ScheduleTableProps {
  schedules: ScheduleDisplay[]
  isLoading?: boolean
  onRowClick?: (schedule: ScheduleDisplay) => void
  onPause?: (scheduleId: string) => void
  onResume?: (scheduleId: string) => void
  onCancel?: (scheduleId: string) => void
}

/**
 * Props for payment stats card
 */
export interface PaymentStatsCardProps {
  stats: PaymentStats
  period?: string
  isLoading?: boolean
}

/**
 * Props for PSP account selector
 */
export interface PSPAccountSelectorProps {
  accounts: PSPAccountsSummaryResponse
  selectedProvider?: PaymentProvider
  onSelect?: (provider: PaymentProvider) => void
  isLoading?: boolean
}

// ============================================
// Helper Types
// ============================================

/**
 * Status badge color mapping
 */
export const PaymentStatusColorMap: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.REJECTED]: 'bg-red-100 text-red-800',
  [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
  [PaymentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
}

/**
 * Schedule status badge color mapping
 */
export const ScheduleStatusColorMap: Record<ScheduleStatus, string> = {
  [ScheduleStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ScheduleStatus.PAUSED]: 'bg-yellow-100 text-yellow-800',
  [ScheduleStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [ScheduleStatus.COMPLETED]: 'bg-blue-100 text-blue-800',
}

/**
 * Provider icon/label mapping
 */
export const PaymentProviderLabels: Record<PaymentProvider, string> = {
  [PaymentProvider.STRIPE]: 'Stripe',
  [PaymentProvider.PAYPAL]: 'PayPal',
  [PaymentProvider.GOCARDLESS]: 'GoCardless',
  [PaymentProvider.SLIMPAY]: 'Slimpay',
  [PaymentProvider.MULTISAFEPAY]: 'MultiSafepay',
  [PaymentProvider.EMERCHANTPAY]: 'Emerchantpay',
}

/**
 * Frequency display labels
 */
export const ScheduleFrequencyLabels: Record<ScheduleFrequency, string> = {
  [ScheduleFrequency.WEEKLY]: 'Weekly',
  [ScheduleFrequency.MONTHLY]: 'Monthly',
  [ScheduleFrequency.QUARTERLY]: 'Quarterly',
  [ScheduleFrequency.YEARLY]: 'Yearly',
}
