import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateGoCardlessMandateDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  gocardlessCustomerId: string;

  @IsString()
  @IsOptional()
  gocardlessBankAccountId?: string;

  @IsString()
  @IsNotEmpty()
  mandateId: string;

  @IsString()
  @IsOptional()
  mandateReference?: string;

  @IsString()
  @IsNotEmpty()
  mandateStatus: string;

  @IsString()
  @IsNotEmpty()
  scheme: string;

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
