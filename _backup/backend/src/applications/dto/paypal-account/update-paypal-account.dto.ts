import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaypalAccountDto {
  @ApiPropertyOptional({ description: 'Nom du compte PayPal' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Client ID PayPal',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Client Secret PayPal',
  })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({
    description: 'ID du webhook PayPal configuré',
  })
  @IsOptional()
  @IsString()
  webhookId?: string;

  @ApiPropertyOptional({
    description: 'Environnement PayPal',
    enum: ['sandbox', 'live'],
  })
  @IsOptional()
  @IsIn(['sandbox', 'live'])
  environment?: 'sandbox' | 'live';

  @ApiPropertyOptional({ description: 'Compte actif' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
