import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateGoCardlessMandateDto {
  @IsString()
  @IsOptional()
  mandateStatus?: string;

  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @IsString()
  @IsOptional()
  subscriptionStatus?: string;

  @IsString()
  @IsOptional()
  nextChargeDate?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
