import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBillingPortalSessionDto {
  @ApiProperty({ description: 'Stripe Customer ID', example: 'cus_xxx' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'URL to redirect customer after portal session',
    example: 'https://yoursite.com/account',
  })
  @IsUrl()
  @IsNotEmpty()
  returnUrl: string;

  @ApiPropertyOptional({
    description: 'Optional Billing Portal configuration ID',
    example: 'bpc_xxx',
  })
  @IsString()
  @IsOptional()
  configuration?: string;
}

export class BillingPortalSessionResponseDto {
  id: string;
  url: string;
  returnUrl: string;
}
