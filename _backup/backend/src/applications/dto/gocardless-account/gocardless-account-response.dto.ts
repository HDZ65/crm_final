import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoCardlessAccountResponseDto {
  @ApiProperty({ description: 'ID du compte GoCardless' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte GoCardless' })
  nom: string;

  @ApiProperty({
    description: 'Access token masqué',
    example: '****abcd',
  })
  accessTokenMasked: string;

  @ApiPropertyOptional({
    description: 'Indique si un webhook secret est configuré',
  })
  hasWebhookSecret: boolean;

  @ApiProperty({ description: 'Environnement GoCardless', enum: ['sandbox', 'live'] })
  environment: 'sandbox' | 'live';

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskToken(token: string): string {
    if (!token || token.length < 8) return '****';
    const suffix = token.slice(-4);
    return `****${suffix}`;
  }
}
