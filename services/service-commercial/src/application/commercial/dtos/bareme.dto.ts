import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, IsEnum, IsDate } from 'class-validator';
import { TypeCalcul, BaseCalcul } from '../../../domain/commercial/entities/bareme-commission.entity';

export class CreateBaremeDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TypeCalcul)
  typeCalcul: TypeCalcul;

  @IsEnum(BaseCalcul)
  baseCalcul: BaseCalcul;

  @IsOptional()
  @IsNumber()
  montantFixe?: number;

  @IsOptional()
  @IsNumber()
  tauxPourcentage?: number;

  @IsOptional()
  @IsBoolean()
  recurrenceActive?: boolean;

  @IsOptional()
  @IsNumber()
  tauxRecurrence?: number;

  @IsOptional()
  @IsNumber()
  dureeRecurrenceMois?: number;

  @IsOptional()
  @IsNumber()
  dureeReprisesMois?: number;

  @IsOptional()
  @IsNumber()
  tauxReprise?: number;

  @IsOptional()
  @IsString()
  typeProduit?: string;

  dateEffet: Date;

  @IsOptional()
  dateFin?: Date;
}

export class UpdateBaremeDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  dateFin?: Date;
}

export class BaremeResponseDto {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;
  typeCalcul: TypeCalcul;
  baseCalcul: BaseCalcul;
  montantFixe: number | null;
  tauxPourcentage: number | null;
  recurrenceActive: boolean;
  tauxRecurrence: number | null;
  dureeRecurrenceMois: number | null;
  dureeReprisesMois: number;
  tauxReprise: number;
  typeProduit: string | null;
  dateEffet: Date;
  dateFin: Date | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BaremeFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsString()
  typeProduit?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
