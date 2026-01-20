import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUrl,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaypalPaymentIntent {
  CAPTURE = 'CAPTURE',
  AUTHORIZE = 'AUTHORIZE',
}

export class PaypalPurchaseUnitDto {
  @ApiPropertyOptional({ description: 'Reference ID for this purchase unit' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ description: 'Amount in cents (will be converted to decimal). Min: 100 (1.00€)' })
  @IsNumber()
  @IsNotEmpty()
  @Min(100, { message: 'Amount must be at least 100 cents (1.00€)' })
  @Max(99999900, { message: 'Amount must not exceed 99999900 cents (999,999€)' })
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code (default: EUR)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Description of the purchase' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Custom ID for your reference' })
  @IsString()
  @IsOptional()
  customId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID for your reference' })
  @IsString()
  @IsOptional()
  invoiceId?: string;
}

export class CreatePaypalOrderDto {
  @ApiPropertyOptional({ description: 'ID de la société (pour multi-compte)' })
  @IsUUID()
  @IsOptional()
  societeId?: string;

  @ApiProperty({
    description: 'Payment intent',
    enum: PaypalPaymentIntent,
    default: PaypalPaymentIntent.CAPTURE,
  })
  @IsEnum(PaypalPaymentIntent)
  @IsNotEmpty()
  intent: PaypalPaymentIntent;

  @ApiProperty({
    description: 'Purchase units (at least one required)',
    type: [PaypalPurchaseUnitDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaypalPurchaseUnitDto)
  @IsNotEmpty()
  purchaseUnits: PaypalPurchaseUnitDto[];

  @ApiProperty({ description: 'Return URL after buyer approves payment' })
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['https', 'http'],
      require_valid_protocol: true,
      allow_underscores: true,
      require_tld: false, // Allow localhost
    },
    { message: 'returnUrl doit être une URL valide (ex: http://localhost:3000/success)' },
  )
  @IsNotEmpty()
  returnUrl: string;

  @ApiProperty({ description: 'Cancel URL if buyer cancels' })
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['https', 'http'],
      require_valid_protocol: true,
      allow_underscores: true,
      require_tld: false, // Allow localhost
    },
    { message: 'cancelUrl doit être une URL valide (ex: http://localhost:3000/cancel)' },
  )
  @IsNotEmpty()
  cancelUrl: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;
}
