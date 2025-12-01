import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganisationResponseDto {
  @ApiProperty({ description: 'ID de l\'organisation' })
  id: string;

  @ApiProperty({ description: 'Nom de l\'organisation' })
  nom: string;

  @ApiPropertyOptional({ description: 'Description de l\'organisation' })
  description?: string;

  @ApiPropertyOptional({ description: 'Numéro SIRET' })
  siret?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'organisation' })
  adresse?: string;

  @ApiPropertyOptional({ description: 'Téléphone de l\'organisation' })
  telephone?: string;

  @ApiPropertyOptional({ description: 'Email de l\'organisation' })
  email?: string;

  @ApiProperty({ description: 'Organisation active' })
  actif: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  constructor(partial: Partial<OrganisationResponseDto>) {
    Object.assign(this, partial);
  }
}
