import { IsString, IsOptional, IsUUID, IsEnum, IsDate } from 'class-validator';
import { TacheType, TachePriorite, TacheStatut } from '../../../domain/engagement/entities';

export class CreateTacheDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TacheType)
  type?: TacheType;

  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite;

  @IsOptional()
  @IsEnum(TacheStatut)
  statut?: TacheStatut;

  @IsOptional()
  @IsDate()
  dateEcheance?: Date;

  @IsOptional()
  @IsUUID()
  assigneA?: string;

  @IsOptional()
  @IsUUID()
  creePar?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsUUID()
  factureId?: string;

  @IsOptional()
  @IsUUID()
  regleRelanceId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTacheDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TacheType)
  type?: TacheType;

  @IsOptional()
  @IsEnum(TachePriorite)
  priorite?: TachePriorite;

  @IsOptional()
  @IsEnum(TacheStatut)
  statut?: TacheStatut;

  @IsOptional()
  @IsDate()
  dateEcheance?: Date;

  @IsOptional()
  @IsDate()
  dateCompletion?: Date;

  @IsOptional()
  @IsUUID()
  assigneA?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsUUID()
  factureId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class TacheResponseDto {
  id: string;
  organisationId: string;
  titre: string;
  description: string | null;
  type: TacheType;
  priorite: TachePriorite;
  statut: TacheStatut;
  dateEcheance: Date | null;
  dateCompletion: Date | null;
  assigneA: string | null;
  creePar: string | null;
  clientId: string | null;
  contratId: string | null;
  factureId: string | null;
  regleRelanceId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}
