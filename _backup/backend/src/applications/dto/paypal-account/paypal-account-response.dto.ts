import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaypalAccountResponseDto {
  @ApiProperty({ description: 'ID du compte PayPal' })
  id: string;

  @ApiProperty({ description: 'ID de la société associée' })
  societeId: string;

  @ApiProperty({ description: 'Nom du compte PayPal' })
  nom: string;

  @ApiProperty({
    description: 'Client ID masqué',
    example: 'AXxx****xxxx',
  })
  clientIdMasked: string;

  @ApiPropertyOptional({
    description: 'Indique si un webhook ID est configuré',
  })
  hasWebhookId: boolean;

  @ApiProperty({
    description: 'Environnement PayPal',
    enum: ['sandbox', 'live'],
  })
  environment: 'sandbox' | 'live';

  @ApiProperty({ description: 'Compte actif' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  static maskClientId(clientId: string): string {
    if (!clientId || clientId.length < 8) return '****';
    const prefix = clientId.substring(0, 4);
    const suffix = clientId.slice(-4);
    return `${prefix}****${suffix}`;
  }
}
