import { ScheduleStatus, PSPName } from '../../../core/domain/payment.enums';

export class ScheduleResponseDto {
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
  intervalUnit?: 'day' | 'week' | 'month' | 'year' | null;
  intervalCount?: number | null;

  // Status
  status: ScheduleStatus;
  retryCount: number;
  maxRetries: number;
  lastFailureAt?: Date | null;
  lastFailureReason?: string | null;

  // PSP references
  pspMandateId?: string | null;
  pspCustomerId?: string | null;

  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}
