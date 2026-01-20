import { ApiProperty } from '@nestjs/swagger';

export class EmerchantpayAccountResponseDto {
  @ApiProperty({ description: 'ID du compte Emerchantpay' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte Emerchantpay' })
  nom: string;

  @ApiProperty({ description: 'Nom d\'utilisateur Genesis Gateway' })
  username: string;

  @ApiProperty({
    description: 'Mot de passe masqué',
    example: '********',
  })
  passwordMasked: string;

  @ApiProperty({
    description: 'Terminal token masqué',
    example: '****abcd',
  })
  terminalTokenMasked: string;

  @ApiProperty({ description: 'Environnement Emerchantpay', enum: ['staging', 'production'] })
  environment: 'staging' | 'production';

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskPassword(): string {
    return '********';
  }

  static maskToken(token: string): string {
    if (!token || token.length < 8) return '****';
    const suffix = token.slice(-4);
    return `****${suffix}`;
  }
}
