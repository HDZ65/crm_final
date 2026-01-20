import {
  PaymentIntentStatus,
  PSPName,
} from '../../../core/domain/payment.enums';

export class PaymentIntentResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
}
