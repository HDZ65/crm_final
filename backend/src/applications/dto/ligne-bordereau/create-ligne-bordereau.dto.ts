import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateLigneBordereauDto {
  @IsString()
  organisationId: string;

  @IsString()
  bordereauId: string;

  @IsOptional()
  @IsString()
  commissionId?: string | null;

  @IsOptional()
  @IsString()
  repriseId?: string | null;

  @IsIn(['commission', 'reprise', 'acompte', 'prime', 'regularisation'])
  typeLigne: string;

  @IsString()
  contratId: string;

  @IsString()
  contratReference: string;

  @IsOptional()
  @IsString()
  clientNom?: string | null;

  @IsOptional()
  @IsString()
  produitNom?: string | null;

  @IsNumber()
  montantBrut: number;

  @IsOptional()
  @IsNumber()
  montantReprise?: number;

  @IsNumber()
  montantNet: number;

  @IsOptional()
  @IsString()
  baseCalcul?: string | null;

  @IsOptional()
  @IsNumber()
  tauxApplique?: number | null;

  @IsOptional()
  @IsString()
  baremeId?: string | null;

  @IsOptional()
  @IsNumber()
  ordre?: number;
}
