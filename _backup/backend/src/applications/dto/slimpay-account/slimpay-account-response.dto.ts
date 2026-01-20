import { ApiProperty } from '@nestjs/swagger';

export class SlimpayAccountResponseDto {
  @ApiProperty({ description: 'ID du compte Slimpay' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Slimpay' })
  nom: string;

  @ApiProperty({ description: 'Application ID OAuth2' })
  appId: string;

  @ApiProperty({
    description: 'Application Secret masqué',
    example: '****abcd',
  })
  appSecretMasked: string;

  @ApiProperty({ description: 'Référence du créancier SEPA' })
  creditorReference: string;

  @ApiProperty({ description: 'Environnement Slimpay', enum: ['preprod', 'production'] })
  environment: 'preprod' | 'production';

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskSecret(secret: string): string {
    if (!secret || secret.length < 8) return '****';
    const suffix = secret.slice(-4);
    return `****${suffix}`;
  }
}
