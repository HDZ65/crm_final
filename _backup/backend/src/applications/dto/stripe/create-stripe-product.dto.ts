import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateStripeProductDto {
  @ApiProperty({ description: 'Nom du produit' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description du produit' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
