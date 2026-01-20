import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSetupIntentDto {
  @ApiPropertyOptional({ description: 'Stripe Customer ID to attach payment method' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Payment method types (e.g., ["card", "sepa_debit"]). If not provided, automatic payment methods will be enabled.',
    example: ['card'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethodTypes?: string[];

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Usage mode: on_session (customer present) or off_session (future charges)',
    example: 'off_session',
  })
  @IsString()
  @IsIn(['on_session', 'off_session'])
  @IsOptional()
  usage?: 'on_session' | 'off_session';

  @ApiPropertyOptional({ description: 'Description for the SetupIntent' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SetupIntentResponseDto {
  id: string;
  clientSecret: string;
  status: string;
  customerId?: string;
  paymentMethodId?: string;
}
