import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Payment Intent ID to refund' })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiPropertyOptional({ description: 'Amount to refund in cents (partial refund)' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Reason for refund', enum: RefundReason })
  @IsEnum(RefundReason)
  @IsOptional()
  reason?: RefundReason;
}
