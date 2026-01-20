import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaypalBillingInterval {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum PaypalTenureType {
  REGULAR = 'REGULAR',
  TRIAL = 'TRIAL',
}

export class PaypalBillingCycleDto {
  @ApiProperty({
    description: 'Tenure type',
    enum: PaypalTenureType,
    default: PaypalTenureType.REGULAR,
  })
  @IsEnum(PaypalTenureType)
  @IsNotEmpty()
  tenureType: PaypalTenureType;

  @ApiProperty({ description: 'Sequence order (1, 2, 3)' })
  @IsNumber()
  @Min(1)
  @Max(3)
  sequence: number;

  @ApiProperty({ description: 'Total cycles (0 = infinite)' })
  @IsNumber()
  @Min(0)
  @Max(999)
  totalCycles: number;

  @ApiProperty({
    description: 'Billing interval',
    enum: PaypalBillingInterval,
  })
  @IsEnum(PaypalBillingInterval)
  @IsNotEmpty()
  intervalUnit: PaypalBillingInterval;

  @ApiProperty({ description: 'Interval count (e.g., 1 for every month, 2 for every 2 months)' })
  @IsNumber()
  @Min(1)
  @Max(365)
  intervalCount: number;

  @ApiProperty({ description: 'Price in cents' })
  @IsNumber()
  @Min(100)
  @Max(99999900)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code (default: EUR)' })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreatePaypalPlanDto {
  @ApiPropertyOptional({ description: 'ID de la société (pour multi-compte)' })
  @IsUUID()
  @IsOptional()
  societeId?: string;

  @ApiProperty({ description: 'Plan name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Billing cycles (at least one required)',
    type: [PaypalBillingCycleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaypalBillingCycleDto)
  @IsNotEmpty()
  billingCycles: PaypalBillingCycleDto[];

  @ApiPropertyOptional({ description: 'Setup fee in cents' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  setupFee?: number;

  @ApiPropertyOptional({ description: 'Currency code (default: EUR)' })
  @IsString()
  @IsOptional()
  currency?: string;
}
