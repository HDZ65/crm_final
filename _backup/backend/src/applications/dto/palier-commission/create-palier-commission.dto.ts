import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreatePalierCommissionDto {
  @IsString()
  organisationId: string;

  @IsString()
  baremeId: string;

  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsIn(['volume', 'ca', 'prime_produit'])
  typePalier: string;

  @IsNumber()
  seuilMin: number;

  @IsOptional()
  @IsNumber()
  seuilMax?: number | null;

  @IsNumber()
  montantPrime: number;

  @IsOptional()
  @IsNumber()
  tauxBonus?: number | null;

  @IsOptional()
  @IsBoolean()
  cumulable?: boolean;

  @IsOptional()
  @IsBoolean()
  parPeriode?: boolean;

  @IsOptional()
  @IsString()
  typeProduit?: string | null;

  @IsOptional()
  @IsNumber()
  ordre?: number;
}
