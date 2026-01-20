import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoCardlessAccountDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  @IsNotEmpty()
  societeId: string;

  @ApiProperty({ description: 'Nom du compte GoCardless' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Access token GoCardless' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional({ description: 'Webhook secret pour la vérification des signatures' })
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @ApiProperty({ description: 'Environnement GoCardless', enum: ['sandbox', 'live'] })
  @IsIn(['sandbox', 'live'])
  @IsNotEmpty()
  environment: 'sandbox' | 'live';

  @ApiPropertyOptional({ description: 'Compte actif', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
