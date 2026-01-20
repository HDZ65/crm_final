import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateContratDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsNotEmpty()
  statut: string;

  @IsString()
  @IsNotEmpty()
  dateDebut: string;

  @IsString()
  @IsOptional()
  dateFin?: string;

  @IsString()
  @IsOptional()
  dateSignature?: string;

  @IsNumber()
  @IsOptional()
  montant?: number;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsString()
  @IsOptional()
  frequenceFacturation?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  fournisseur?: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsUUID()
  @IsNotEmpty()
  commercialId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
