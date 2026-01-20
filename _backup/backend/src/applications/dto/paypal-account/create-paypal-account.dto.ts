import { IsString, IsBoolean, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaypalAccountDto {
  @ApiProperty({ description: 'ID de la société associée' })
  @IsUUID()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte PayPal', example: 'Compte PayPal principal' })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Client ID PayPal',
    example: 'AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'Client Secret PayPal',
    example: 'ELxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  clientSecret: string;

  @ApiPropertyOptional({
    description: 'ID du webhook PayPal configuré',
    example: 'WH-xxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  webhookId?: string;

  @ApiProperty({
    description: 'Environnement PayPal',
    enum: ['sandbox', 'live'],
    default: 'sandbox',
  })
  @IsIn(['sandbox', 'live'])
  environment: 'sandbox' | 'live';

  @ApiPropertyOptional({
    description: 'Compte actif',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
