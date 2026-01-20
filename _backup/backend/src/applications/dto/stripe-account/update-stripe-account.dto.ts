import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStripeAccountDto {
  @ApiPropertyOptional({ description: 'Nom du compte Stripe' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Clé secrète Stripe (sk_test_* ou sk_live_*)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^sk_(test|live)_[a-zA-Z0-9]+$/, {
    message: 'La clé secrète doit être au format sk_test_* ou sk_live_*',
  })
  stripeSecretKey?: string;

  @ApiPropertyOptional({
    description: 'Clé publique Stripe (pk_test_* ou pk_live_*)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^pk_(test|live)_[a-zA-Z0-9]+$/, {
    message: 'La clé publique doit être au format pk_test_* ou pk_live_*',
  })
  stripePublishableKey?: string;

  @ApiPropertyOptional({
    description: 'Secret du webhook Stripe (whsec_*)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^whsec_[a-zA-Z0-9]+$/, {
    message: 'Le secret webhook doit être au format whsec_*',
  })
  stripeWebhookSecret?: string;

  @ApiPropertyOptional({ description: 'Mode test activé' })
  @IsOptional()
  @IsBoolean()
  isTestMode?: boolean;

  @ApiPropertyOptional({ description: 'Compte actif' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
