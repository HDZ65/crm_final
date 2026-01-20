import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStripePaymentIntentDto {
  @ApiProperty({ description: 'Amount in cents. Min: 50 (0.50€), Max: 99999900 (999,999€)', example: 2000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(50, { message: 'Amount must be at least 50 cents (0.50€)' })
  @Max(99999900, { message: 'Amount must not exceed 99999900 cents (999,999€)' })
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'eur' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({ description: 'Stripe Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Email for receipt' })
  @IsEmail()
  @IsOptional()
  receiptEmail?: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Enable automatic payment methods (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  automaticPaymentMethods?: boolean;
}
