import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateRepriseCommissionDto {
  @IsString()
  organisationId: string;

  @IsString()
  commissionOriginaleId: string;

  @IsString()
  contratId: string;

  @IsString()
  apporteurId: string;

  @IsString()
  reference: string;

  @IsIn(['resiliation', 'impaye', 'annulation', 'regularisation'])
  typeReprise: string;

  @IsNumber()
  montantReprise: number;

  @IsOptional()
  @IsNumber()
  tauxReprise?: number;

  @IsNumber()
  montantOriginal: number;

  @IsString()
  periodeOrigine: string;

  @IsString()
  periodeApplication: string;

  @IsDateString()
  dateEvenement: string;

  @IsDateString()
  dateLimite: string;

  @IsOptional()
  @IsString()
  motif?: string | null;

  @IsOptional()
  @IsString()
  commentaire?: string | null;
}
