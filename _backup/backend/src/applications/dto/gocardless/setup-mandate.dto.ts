import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class SetupMandateDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;

  @IsString()
  @IsNotEmpty()
  exitUri: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  scheme?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class SetupMandateResponseDto {
  billingRequestId: string;
  authorisationUrl: string;

  constructor(billingRequestId: string, authorisationUrl: string) {
    this.billingRequestId = billingRequestId;
    this.authorisationUrl = authorisationUrl;
  }
}
