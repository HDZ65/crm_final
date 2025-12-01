import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsIn } from 'class-validator';

const NOTIFICATION_TYPES = [
  'CONTRAT_EXPIRE',
  'CONTRAT_BIENTOT_EXPIRE',
  'IMPAYE',
  'NOUVEAU_CLIENT',
  'NOUVEAU_CONTRAT',
  'TACHE_ASSIGNEE',
  'RAPPEL',
  'ALERTE',
  'INFO',
  'SYSTEME',
] as const;

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @IsString()
  @IsIn(NOTIFICATION_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsBoolean()
  lu?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  lienUrl?: string;
}
