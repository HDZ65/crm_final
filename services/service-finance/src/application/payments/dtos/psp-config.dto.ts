import { IsString, IsBoolean, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export enum PspTypeDto {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  GOCARDLESS = 'gocardless',
  EMERCHANTPAY = 'emerchantpay',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
}

export class SavePspAccountDto {
  @IsString() @IsNotEmpty() societeId: string;
  @IsEnum(PspTypeDto) pspType: PspTypeDto;
  @IsString() @IsNotEmpty() nom: string;
  // Stripe
  @IsOptional() @IsString() stripeSecretKey?: string;
  @IsOptional() @IsString() stripePublishableKey?: string;
  @IsOptional() @IsString() stripeWebhookSecret?: string;
  @IsOptional() @IsBoolean() isTestMode?: boolean;
  // GoCardless
  @IsOptional() @IsString() accessToken?: string;
  @IsOptional() @IsString() webhookSecret?: string;
  @IsOptional() @IsString() organisationId?: string;
  @IsOptional() @IsBoolean() isSandbox?: boolean;
  // Slimpay
  @IsOptional() @IsString() appName?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() creditorReference?: string;
  // MultiSafepay
  @IsOptional() @IsString() apiKey?: string;
  // Emerchantpay
  @IsOptional() @IsString() apiLogin?: string;
  @IsOptional() @IsString() apiPassword?: string;
  @IsOptional() @IsString() terminalToken?: string;
  @IsOptional() @IsString() webhookPublicKey?: string;
  // PayPal
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() clientSecret?: string;
  @IsOptional() @IsString() webhookId?: string;
}

export class GetPspAccountDto {
  @IsString() @IsNotEmpty() societeId: string;
  @IsEnum(PspTypeDto) pspType: PspTypeDto;
}

export class TestPspConnectionDto {
  @IsString() @IsNotEmpty() societeId: string;
  @IsEnum(PspTypeDto) pspType: PspTypeDto;
}

export class DeactivatePspAccountDto {
  @IsString() @IsNotEmpty() societeId: string;
  @IsEnum(PspTypeDto) pspType: PspTypeDto;
}

export class PspConfigResponseDto {
  id: string;
  societeId: string;
  nom: string;
  pspType: PspTypeDto;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Config fields (populated based on pspType)
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
  isTestMode?: boolean;
  accessToken?: string;
  webhookSecret?: string;
  organisationId?: string;
  isSandbox?: boolean;
  appName?: string;
  appSecret?: string;
  creditorReference?: string;
  apiKey?: string;
  apiLogin?: string;
  apiPassword?: string;
  terminalToken?: string;
  webhookPublicKey?: string;
  clientId?: string;
  clientSecret?: string;
  webhookId?: string;
}

export class PspConnectionTestResultDto {
  success: boolean;
  message: string;
  details?: string;
}
