import { IsString, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { StatutBordereau } from '../../../domain/commercial/entities/bordereau-commission.entity';

export class CreateBordereauDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  reference: string;

  @IsString()
  periode: string;

  @IsUUID()
  apporteurId: string;

  @IsOptional()
  @IsNumber()
  totalBrut?: number;

  @IsOptional()
  @IsNumber()
  totalReprises?: number;

  @IsOptional()
  @IsNumber()
  totalNetAPayer?: number;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  creePar?: string;
}

export class UpdateBordereauDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(StatutBordereau)
  statutBordereau?: StatutBordereau;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsUUID()
  validateurId?: string;
}

export class BordereauResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  periode: string;
  apporteurId: string;
  totalBrut: number;
  totalReprises: number;
  totalAcomptes: number;
  totalNetAPayer: number;
  nombreLignes: number;
  statutBordereau: StatutBordereau;
  dateValidation: Date | null;
  validateurId: string | null;
  dateExport: Date | null;
  commentaire: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BordereauFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  apporteurId?: string;

  @IsOptional()
  @IsString()
  periode?: string;

  @IsOptional()
  @IsEnum(StatutBordereau)
  statutBordereau?: StatutBordereau;
}
