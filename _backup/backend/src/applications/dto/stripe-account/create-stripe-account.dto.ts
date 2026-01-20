import { IsString, IsBoolean, IsOptional, Matches, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStripeAccountDto {
  @ApiProperty({ description: 'ID de la société associée' })
  @IsUUID()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Stripe', example: 'Compte principal' })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Clé secrète Stripe (sk_test_* ou sk_live_*)',
    example: 'sk_test_xxxxxxxxxxxx',
  })
  @IsString()
  @Matches(/^sk_(test|live)_[a-zA-Z0-9]+$/, {
    message: 'La clé secrète doit être au format sk_test_* ou sk_live_*',
  })
  stripeSecretKey: string;

  @ApiProperty({
    description: 'Clé publique Stripe (pk_test_* ou pk_live_*)',
    example: 'pk_test_xxxxxxxxxxxx',
  })
  @IsString()
  @Matches(/^pk_(test|live)_[a-zA-Z0-9]+$/, {
    message: 'La clé publique doit être au format pk_test_* ou pk_live_*',
  })
  stripePublishableKey: string;

  @ApiPropertyOptional({
    description: 'Secret du webhook Stripe (whsec_*)',
    example: 'whsec_xxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  @Matches(/^whsec_[a-zA-Z0-9]+$/, {
    message: 'Le secret webhook doit être au format whsec_*',
  })
  stripeWebhookSecret?: string;

  @ApiPropertyOptional({
    description: 'Mode test activé',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isTestMode?: boolean;

  @ApiPropertyOptional({
    description: 'Compte actif',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
