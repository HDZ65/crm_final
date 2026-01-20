import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripeAccountResponseDto {
  @ApiProperty({ description: 'ID du compte Stripe' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Stripe' })
  nom: string;

  @ApiProperty({
    description: 'Clé secrète masquée (sk_****XXXX)',
    example: 'sk_****abcd',
  })
  stripeSecretKeyMasked: string;

  @ApiProperty({ description: 'Clé publique Stripe' })
  stripePublishableKey: string;

  @ApiPropertyOptional({
    description: 'Indique si un webhook secret est configuré',
  })
  hasWebhookSecret: boolean;

  @ApiProperty({ description: 'Mode test activé' })
  isTestMode: boolean;

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskSecretKey(key: string): string {
    if (!key || key.length < 8) return '****';
    const prefix = key.substring(0, 7); // sk_test_ or sk_live_
    const suffix = key.slice(-4);
    return `${prefix}****${suffix}`;
  }
}
