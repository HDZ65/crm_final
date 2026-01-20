import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentBehavior {
  DEFAULT_INCOMPLETE = 'default_incomplete',
  ERROR_IF_INCOMPLETE = 'error_if_incomplete',
  ALLOW_INCOMPLETE = 'allow_incomplete',
}

export class CreateStripeSubscriptionDto {
  @ApiProperty({ description: 'Stripe Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Stripe Price ID' })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsNumber()
  @IsOptional()
  trialPeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Payment behavior',
    enum: PaymentBehavior,
    default: PaymentBehavior.DEFAULT_INCOMPLETE,
  })
  @IsEnum(PaymentBehavior)
  @IsOptional()
  paymentBehavior?: PaymentBehavior;
}
