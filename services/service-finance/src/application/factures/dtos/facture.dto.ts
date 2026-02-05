import { IsString, IsOptional, IsUUID, IsNumber, IsDate } from 'class-validator';

export class CreateFactureDto {
  @IsUUID()
  organisationId: string;

  @IsUUID()
  clientBaseId: string;

  @IsUUID()
  clientPartenaireId: string;

  @IsUUID()
  adresseFacturationId: string;

  @IsUUID()
  emissionFactureId: string;

  @IsUUID()
  statutId: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsDate()
  dateEmission: Date;
}

export class UpdateFactureDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsNumber()
  montantHT?: number;

  @IsOptional()
  @IsNumber()
  montantTTC?: number;

  @IsOptional()
  @IsUUID()
  statutId?: string;
}

export class FactureResponseDto {
  id: string;
  organisationId: string;
  numero: string | null;
  dateEmission: Date;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  clientBaseId: string;
  contratId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
