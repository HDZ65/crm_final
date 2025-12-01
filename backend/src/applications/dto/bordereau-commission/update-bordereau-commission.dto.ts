import { PartialType } from '@nestjs/mapped-types';
import { CreateBordereauCommissionDto } from './create-bordereau-commission.dto';
import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class UpdateBordereauCommissionDto extends PartialType(
  CreateBordereauCommissionDto,
) {
  @IsOptional()
  @IsIn(['brouillon', 'valide', 'exporte', 'archive'])
  statutBordereau?: string;

  @IsOptional()
  @IsNumber()
  totalBrut?: number;

  @IsOptional()
  @IsNumber()
  totalReprises?: number;

  @IsOptional()
  @IsNumber()
  totalAcomptes?: number;

  @IsOptional()
  @IsNumber()
  totalNetAPayer?: number;

  @IsOptional()
  @IsNumber()
  nombreLignes?: number;

  @IsOptional()
  @IsString()
  fichierPdfUrl?: string | null;

  @IsOptional()
  @IsString()
  fichierExcelUrl?: string | null;
}
