import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsEmail,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CheckoutMode {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  SETUP = 'setup',
}

export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class LineItemDto {
  @ApiPropertyOptional({ description: 'Stripe Price ID' })
  @IsString()
  @IsOptional()
  priceId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ description: 'Amount in cents (if no priceId). Min: 50 (0.50€), Max: 99999900 (999,999€)' })
  @IsNumber()
  @IsOptional()
  @Min(50, { message: 'Amount must be at least 50 cents (0.50€)' })
  @Max(99999900, { message: 'Amount must not exceed 99999900 cents (999,999€)' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency (default: eur)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Product name (if no priceId)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Billing interval for subscriptions (default: month)',
    enum: BillingInterval,
  })
  @IsEnum(BillingInterval)
  @IsOptional()
  interval?: BillingInterval;
}

export class CreateCheckoutSessionDto {
  @ApiPropertyOptional({ description: 'Stripe Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Customer email (if no customerId)' })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Stripe Price ID for simple checkout' })
  @IsString()
  @IsOptional()
  priceId?: string;

  @ApiPropertyOptional({ description: 'Amount in cents (for one-time payment). Min: 50 (0.50€), Max: 99999900 (999,999€)' })
  @IsNumber()
  @IsOptional()
  @Min(50, { message: 'Amount must be at least 50 cents (0.50€)' })
  @Max(99999900, { message: 'Amount must not exceed 99999900 cents (999,999€)' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency (default: eur)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Checkout mode',
    enum: CheckoutMode,
    example: CheckoutMode.PAYMENT,
  })
  @IsEnum(CheckoutMode)
  @IsNotEmpty()
  mode: CheckoutMode;

  @ApiProperty({ description: 'Success redirect URL (must be HTTPS in production)' })
  @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: 'successUrl must be a valid URL' })
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ description: 'Cancel redirect URL (must be HTTPS in production)' })
  @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: 'cancelUrl must be a valid URL' })
  @IsNotEmpty()
  cancelUrl: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Line items for multiple products',
    type: [LineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsOptional()
  lineItems?: LineItemDto[];
}
