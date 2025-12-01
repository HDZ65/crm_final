import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganisationDto {
  @ApiProperty({ description: 'Nom de l\'organisation' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: 'Description de l\'organisation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Numéro SIRET' })
  @IsString()
  @IsOptional()
  siret?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'organisation' })
  @IsString()
  @IsOptional()
  adresse?: string;

  @ApiPropertyOptional({ description: 'Téléphone de l\'organisation' })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Email de l\'organisation' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Organisation active', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
