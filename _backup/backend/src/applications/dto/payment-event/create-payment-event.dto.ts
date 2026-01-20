import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';
import { PaymentEventType } from '../../../core/domain/payment.enums';

export class CreatePaymentEventDto {
  @IsString()
  @IsNotEmpty()
  pspEventId: string;

  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsEnum(PaymentEventType)
  @IsNotEmpty()
  eventType: PaymentEventType;

  @IsObject()
  @IsNotEmpty()
  rawPayload: Record<string, any>;

  @IsDateString()
  @IsOptional()
  receivedAt?: string;

  @IsBoolean()
  @IsOptional()
  processed?: boolean;
}
