import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';

const DECLENCHEURS = [
  'IMPAYE',
  'CONTRAT_BIENTOT_EXPIRE',
  'CONTRAT_EXPIRE',
  'NOUVEAU_CLIENT',
  'INACTIVITE_CLIENT',
] as const;
const ACTION_TYPES = [
  'CREER_TACHE',
  'ENVOYER_EMAIL',
  'NOTIFICATION',
  'TACHE_ET_EMAIL',
] as const;
const PRIORITES = ['HAUTE', 'MOYENNE', 'BASSE'] as const;

export class CreateRegleRelanceDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(DECLENCHEURS)
  declencheur: string;

  @IsNumber()
  @Min(0)
  delaiJours: number;

  @IsString()
  @IsIn(ACTION_TYPES)
  actionType: string;

  @IsOptional()
  @IsString()
  @IsIn(PRIORITES)
  prioriteTache?: string;

  @IsOptional()
  @IsString()
  templateEmailId?: string;

  @IsOptional()
  @IsString()
  templateTitreTache?: string;

  @IsOptional()
  @IsString()
  templateDescriptionTache?: string;

  @IsOptional()
  @IsString()
  assigneParDefaut?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
