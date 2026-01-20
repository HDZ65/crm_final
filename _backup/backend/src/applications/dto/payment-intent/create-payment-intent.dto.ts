import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  PaymentIntentStatus,
  PSPName,
} from '../../../core/domain/payment.enums';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsString()
  @IsOptional()
  societeId?: string;

  @IsEnum(PSPName)
  @IsNotEmpty()
  pspName: PSPName;

  @IsString()
  @IsOptional()
  pspPaymentId?: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentIntentStatus)
  @IsOptional()
  status?: PaymentIntentStatus;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsString()
  @IsOptional()
  mandateReference?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
