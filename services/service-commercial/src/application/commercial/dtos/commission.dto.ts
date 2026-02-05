import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateCommissionDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  reference: string;

  @IsUUID()
  apporteurId: string;

  @IsUUID()
  contratId: string;

  @IsOptional()
  @IsUUID()
  produitId?: string;

  @IsString()
  compagnie: string;

  @IsString()
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

  @IsUUID()
  statutId: string;

  @IsString()
  periode: string;

  dateCreation: Date;
}

export class UpdateCommissionDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsNumber()
  montantBrut?: number;

  @IsOptional()
  @IsNumber()
  montantReprises?: number;

  @IsOptional()
  @IsNumber()
  montantAcomptes?: number;

  @IsOptional()
  @IsNumber()
  montantNetAPayer?: number;

  @IsOptional()
  @IsUUID()
  statutId?: string;
}

export class CommissionResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  apporteurId: string;
  contratId: string;
  produitId: string | null;
  compagnie: string;
  typeBase: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  statutId: string;
  periode: string;
  dateCreation: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CommissionFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  apporteurId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsString()
  periode?: string;

  @IsOptional()
  @IsUUID()
  statutId?: string;
}
