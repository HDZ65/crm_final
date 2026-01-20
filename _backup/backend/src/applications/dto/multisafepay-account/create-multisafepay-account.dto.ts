import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMultisafepayAccountDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  @IsNotEmpty()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte MultiSafepay' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Clé API MultiSafepay' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Site ID (optionnel)' })
  @IsString()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Secure Code (optionnel)' })
  @IsString()
  @IsOptional()
  secureCode?: string;

  @ApiPropertyOptional({ description: 'Account ID (optionnel)' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiProperty({ description: 'Environnement MultiSafepay', enum: ['test', 'live'] })
  @IsIn(['test', 'live'])
  @IsNotEmpty()
  environment: 'test' | 'live';

  @ApiPropertyOptional({ description: 'Compte actif', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
