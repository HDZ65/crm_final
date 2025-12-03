import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, IsObject, IsUUID } from 'class-validator';

const TACHE_TYPES = ['APPEL', 'EMAIL', 'RDV', 'RELANCE_IMPAYE', 'RELANCE_CONTRAT', 'RENOUVELLEMENT', 'SUIVI', 'AUTRE'] as const;
const TACHE_PRIORITES = ['HAUTE', 'MOYENNE', 'BASSE'] as const;
const TACHE_STATUTS = ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] as const;

export class CreateTacheDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(TACHE_TYPES)
  type: string;

  @IsString()
  @IsIn(TACHE_PRIORITES)
  priorite: string;

  @IsOptional()
  @IsString()
  @IsIn(TACHE_STATUTS)
  statut?: string;

  @IsDateString()
  dateEcheance: string;

  @IsString()
  @IsNotEmpty()
  assigneA: string;

  @IsString()
  @IsNotEmpty()
  creePar: string;

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
  @IsObject()
  metadata?: Record<string, any>;
}
