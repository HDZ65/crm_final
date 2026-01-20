import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCommissionDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  apporteurId: string;

  @IsString()
  @IsNotEmpty()
  contratId: string;

  @IsOptional()
  @IsString()
  produitId?: string | null;

  @IsString()
  @IsNotEmpty()
  compagnie: string;

  @IsString()
  @IsNotEmpty()
  typeBase: string;

  @IsNumber()
  montantBrut: number;

  @IsOptional()
  @IsNumber()
  montantReprises?: number;

  @IsOptional()
  @IsNumber()
  montantAcomptes?: number;

  @IsNumber()
  montantNetAPayer: number;

  @IsString()
  @IsNotEmpty()
  statutId: string;

  @IsString()
  @IsNotEmpty()
  periode: string;

  @IsISO8601()
  @IsNotEmpty()
  dateCreation: string;
}
