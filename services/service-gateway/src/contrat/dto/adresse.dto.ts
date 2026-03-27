import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class AdresseDto {
  @ApiPropertyOptional({ description: 'Numéro de rue', example: '12' })
  @IsOptional()
  @IsString()
  streetnumber?: string;

  @ApiProperty({ description: 'Première ligne d\'adresse', example: 'rue de la Paix' })
  @IsString()
  @IsNotEmpty()
  ligne1: string;

  @ApiPropertyOptional({ description: 'Deuxième ligne d\'adresse', example: 'Bât A' })
  @IsOptional()
  @IsString()
  ligne2?: string;

  @ApiProperty({ description: 'Code postal', example: '75002' })
  @IsString()
  @IsNotEmpty()
  code_postal: string;

  @ApiProperty({ description: 'Ville', example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  ville: string;

  @ApiPropertyOptional({ description: 'Pays (déduit, défaut: FR)', example: 'FR' })
  @IsOptional()
  @IsString()
  pays?: string;
}
