import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaypalSubscriptionDto {
  @ApiPropertyOptional({ description: 'ID de la société (pour multi-compte)' })
  @IsUUID()
  @IsOptional()
  societeId?: string;

  @ApiProperty({ description: 'PayPal Plan ID' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({ description: 'Custom subscriber email' })
  @IsString()
  @IsOptional()
  subscriberEmail?: string;

  @ApiPropertyOptional({ description: 'Custom subscriber given name' })
  @IsString()
  @IsOptional()
  subscriberGivenName?: string;

  @ApiPropertyOptional({ description: 'Custom subscriber surname' })
  @IsString()
  @IsOptional()
  subscriberSurname?: string;

  @ApiPropertyOptional({ description: 'Start time (ISO date string)' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Return URL after subscriber approves' })
  @IsUrl({ require_protocol: true, protocols: ['https', 'http'] })
  @IsNotEmpty()
  returnUrl: string;

  @ApiProperty({ description: 'Cancel URL if subscriber cancels' })
  @IsUrl({ require_protocol: true, protocols: ['https', 'http'] })
  @IsNotEmpty()
  cancelUrl: string;

  @ApiPropertyOptional({ description: 'Custom ID for your reference' })
  @IsString()
  @IsOptional()
  customId?: string;

  @ApiPropertyOptional({ description: 'Metadata for tracking' })
  @IsOptional()
  metadata?: Record<string, string>;
}
