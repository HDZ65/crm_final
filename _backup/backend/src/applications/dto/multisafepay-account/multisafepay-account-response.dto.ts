import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultisafepayAccountResponseDto {
  @ApiProperty({ description: 'ID du compte MultiSafepay' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte MultiSafepay' })
  nom: string;

  @ApiProperty({
    description: 'Clé API masquée',
    example: '****abcd',
  })
  apiKeyMasked: string;

  @ApiPropertyOptional({ description: 'Site ID' })
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Indique si un Secure Code est configuré',
  })
  hasSecureCode: boolean;

  @ApiPropertyOptional({ description: 'Account ID' })
  accountId?: string;

  @ApiProperty({ description: 'Environnement MultiSafepay', enum: ['test', 'live'] })
  environment: 'test' | 'live';

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskApiKey(key: string): string {
    if (!key || key.length < 8) return '****';
    const suffix = key.slice(-4);
    return `****${suffix}`;
  }
}
