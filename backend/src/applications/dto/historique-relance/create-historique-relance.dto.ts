import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, IsObject, IsUUID } from 'class-validator';

const RESULTATS = ['SUCCES', 'ECHEC', 'IGNORE'] as const;

export class CreateHistoriqueRelanceDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsUUID()
  regleRelanceId: string;

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
  tacheCreeeId?: string;

  @IsDateString()
  dateExecution: string;

  @IsString()
  @IsIn(RESULTATS)
  resultat: string;

  @IsOptional()
  @IsString()
  messageErreur?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
