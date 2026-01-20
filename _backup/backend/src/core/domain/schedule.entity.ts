import { BaseEntity } from './base.entity';
import { ScheduleStatus, PSPName } from './payment.enums';

export type IntervalUnit = 'day' | 'week' | 'month' | 'year';

export interface ScheduleProps {
  id?: string;
  organisationId: string;
  factureId?: string | null;
  contratId?: string | null;
  societeId?: string | null;
  clientId?: string | null;
  produitId?: string | null;

  // Payment info
  pspName: PSPName;
  amount: number;
  originalAmount?: number | null;
  currency: string;

  // Contract dates
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  priceLockedAt?: Date | null;

  // Scheduling
  dueDate: Date;
  nextDueDate?: Date | null;
  isRecurring: boolean;
  intervalUnit?: IntervalUnit | null;
  intervalCount?: number | null;

  // Status
  status: ScheduleStatus;
  retryCount: number;
  maxRetries?: number;
  lastFailureAt?: Date | null;
  lastFailureReason?: string | null;

  // PSP reference (mandate for SEPA, payment method for Stripe)
  pspMandateId?: string | null;
  pspCustomerId?: string | null;

  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ScheduleEntity extends BaseEntity {
  organisationId: string;
  factureId?: string | null;
  contratId?: string | null;
  societeId?: string | null;
  clientId?: string | null;
  produitId?: string | null;

  // Payment info
  pspName: PSPName;
  amount: number;
  originalAmount?: number | null;
  currency: string;

  // Contract dates
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  priceLockedAt?: Date | null;

  // Scheduling
  dueDate: Date;
  nextDueDate?: Date | null;
  isRecurring: boolean;
  intervalUnit?: IntervalUnit | null;
  intervalCount?: number | null;

  // Status
  status: ScheduleStatus;
  retryCount: number;
  maxRetries: number;
  lastFailureAt?: Date | null;
  lastFailureReason?: string | null;

  // PSP reference
  pspMandateId?: string | null;
  pspCustomerId?: string | null;

  metadata?: Record<string, any> | null;

  constructor(props: ScheduleProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.factureId = props.factureId ?? null;
    this.contratId = props.contratId ?? null;
    this.societeId = props.societeId ?? null;
    this.clientId = props.clientId ?? null;
    this.produitId = props.produitId ?? null;

    this.pspName = props.pspName;
    this.amount = props.amount;
    this.originalAmount = props.originalAmount ?? props.amount;
    this.currency = props.currency;

    this.contractStartDate = props.contractStartDate ?? null;
    this.contractEndDate = props.contractEndDate ?? null;
    this.priceLockedAt = props.priceLockedAt ?? new Date();

    this.dueDate = props.dueDate;
    this.nextDueDate = props.nextDueDate ?? null;
    this.isRecurring = props.isRecurring;
    this.intervalUnit = props.intervalUnit ?? null;
    this.intervalCount = props.intervalCount ?? 1;

    this.status = props.status;
    this.retryCount = props.retryCount;
    this.maxRetries = props.maxRetries ?? 3;
    this.lastFailureAt = props.lastFailureAt ?? null;
    this.lastFailureReason = props.lastFailureReason ?? null;

    this.pspMandateId = props.pspMandateId ?? null;
    this.pspCustomerId = props.pspCustomerId ?? null;

    this.metadata = props.metadata ?? null;
  }

  /**
   * Check if this schedule is due for payment
   */
  isDue(): boolean {
    const now = new Date();
    const dateToCheck = this.nextDueDate ?? this.dueDate;
    return now >= dateToCheck && this.status === ScheduleStatus.PLANNED;
  }

  /**
   * Check if payment can be retried
   */
  canRetry(): boolean {
    return this.status === ScheduleStatus.FAILED && this.retryCount < this.maxRetries;
  }

  isPaid(): boolean {
    return this.status === ScheduleStatus.PAID;
  }

  isUnpaid(): boolean {
    return this.status === ScheduleStatus.UNPAID;
  }

  isActive(): boolean {
    return this.status === ScheduleStatus.PLANNED || this.status === ScheduleStatus.PENDING;
  }

  /**
   * Calculate the next due date based on interval
   */
  calculateNextDueDate(): Date | null {
    if (!this.isRecurring || !this.intervalUnit) {
      return null;
    }

    const baseDate = this.nextDueDate ?? this.dueDate;
    const next = new Date(baseDate);
    const count = this.intervalCount ?? 1;

    switch (this.intervalUnit) {
      case 'day':
        next.setDate(next.getDate() + count);
        break;
      case 'week':
        next.setDate(next.getDate() + count * 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + count);
        break;
      case 'year':
        next.setFullYear(next.getFullYear() + count);
        break;
    }

    return next;
  }

  /**
   * Check if contract has expired (needs explicit renewal)
   */
  isContractExpired(): boolean {
    if (!this.contractEndDate) {
      return false; // No end date = never expires
    }
    return new Date() > this.contractEndDate;
  }

  /**
   * Check if contract is expiring soon (within given days)
   */
  isContractExpiringSoon(daysBeforeExpiry: number = 30): boolean {
    if (!this.contractEndDate) {
      return false;
    }
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysBeforeExpiry);
    return this.contractEndDate <= warningDate && !this.isContractExpired();
  }

  /**
   * Renew contract with new price (explicit renewal)
   */
  renewContract(newAmount: number, newContractEndDate?: Date): void {
    this.amount = newAmount;
    this.priceLockedAt = new Date();
    this.contractStartDate = new Date();
    this.contractEndDate = newContractEndDate ?? null;
    this.status = ScheduleStatus.PLANNED;
    this.retryCount = 0;
    this.lastFailureAt = null;
    this.lastFailureReason = null;
  }

  /**
   * Check if price has changed from original
   */
  hasPriceChanged(): boolean {
    return this.originalAmount !== null && this.amount !== this.originalAmount;
  }

  /**
   * Get price difference since subscription
   */
  getPriceDifference(): number {
    if (this.originalAmount == null) {
      return 0;
    }
    return this.amount - this.originalAmount;
  }
}
