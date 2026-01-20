import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateBaremeCommissionDto {
  @IsString()
  organisationId: string;

  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsIn(['fixe', 'pourcentage', 'palier', 'mixte'])
  typeCalcul: string;

  @IsIn(['cotisation_ht', 'ca_ht', 'forfait'])
  baseCalcul: string;

  @IsOptional()
  @IsNumber()
  montantFixe?: number | null;

  @IsOptional()
  @IsNumber()
  tauxPourcentage?: number | null;

  @IsOptional()
  @IsBoolean()
  precomptee?: boolean;

  @IsOptional()
  @IsBoolean()
  recurrenceActive?: boolean;

  @IsOptional()
  @IsNumber()
  tauxRecurrence?: number | null;

  @IsOptional()
  @IsNumber()
  dureeRecurrenceMois?: number | null;

  @IsOptional()
  @IsNumber()
  dureeReprisesMois?: number;

  @IsOptional()
  @IsNumber()
  tauxReprise?: number;

  @IsOptional()
  @IsString()
  typeProduit?: string | null;

  @IsOptional()
  @IsString()
  profilRemuneration?: string | null;

  @IsOptional()
  @IsString()
  societeId?: string | null;

  @IsOptional()
  @IsIn(['terrain', 'web', 'televente'])
  canalVente?: string | null;

  // Répartition (doit totaliser 100%)
  @IsOptional()
  @IsNumber()
  repartitionCommercial?: number;

  @IsOptional()
  @IsNumber()
  repartitionManager?: number;

  @IsOptional()
  @IsNumber()
  repartitionAgence?: number;

  @IsOptional()
  @IsNumber()
  repartitionEntreprise?: number;

  @IsDateString()
  dateEffet: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string | null;

  @IsOptional()
  @IsString()
  creePar?: string | null;

  @IsOptional()
  @IsString()
  motifModification?: string | null;
}
