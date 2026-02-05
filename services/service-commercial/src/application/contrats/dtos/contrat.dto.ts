import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateContratDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  statut: string;

  @IsString()
  dateDebut: string;

  @IsOptional()
  @IsString()
  dateFin?: string;

  @IsOptional()
  @IsString()
  dateSignature?: string;

  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  frequenceFacturation?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @IsUUID()
  clientId: string;

  @IsUUID()
  commercialId: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContratDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  dateDebut?: string;

  @IsOptional()
  @IsString()
  dateFin?: string;

  @IsOptional()
  @IsString()
  dateSignature?: string;

  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  frequenceFacturation?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  commercialId?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ContratResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  titre: string | null;
  description: string | null;
  type: string | null;
  statut: string;
  dateDebut: string;
  dateFin: string | null;
  dateSignature: string | null;
  montant: number | null;
  devise: string;
  frequenceFacturation: string | null;
  documentUrl: string | null;
  fournisseur: string | null;
  clientId: string;
  commercialId: string;
  societeId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ContratFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  commercialId?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
