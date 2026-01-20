import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentIntentStatus } from '../../../core/domain/payment.enums';

export class UpdatePaymentIntentDto {
  @IsString()
  @IsOptional()
  societeId?: string;

  @IsString()
  @IsOptional()
  pspPaymentId?: string;

  @IsEnum(PaymentIntentStatus)
  @IsOptional()
  status?: PaymentIntentStatus;

  @IsString()
  @IsOptional()
  errorCode?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
