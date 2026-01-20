import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpeditionDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsOptional()
  @IsString()
  contratId?: string | null;

  @IsString()
  @IsNotEmpty()
  transporteurCompteId: string;

  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  etat: string;

  @IsISO8601()
  @IsNotEmpty()
  dateCreation: string;

  @IsISO8601()
  @IsNotEmpty()
  dateDernierStatut: string;

  @IsString()
  @IsNotEmpty()
  labelUrl: string;

  // Nouveaux champs pour le suivi des expéditions
  @IsString()
  @IsNotEmpty()
  referenceCommande: string;

  @IsOptional()
  @IsString()
  produitId?: string | null;

  @IsOptional()
  @IsString()
  nomProduit?: string | null;

  @IsOptional()
  @IsNumber()
  poids?: number | null;

  @IsOptional()
  @IsString()
  adresseDestination?: string | null;

  @IsOptional()
  @IsString()
  villeDestination?: string | null;

  @IsOptional()
  @IsString()
  codePostalDestination?: string | null;

  @IsOptional()
  @IsISO8601()
  dateExpedition?: string | null;

  @IsOptional()
  @IsISO8601()
  dateLivraisonEstimee?: string | null;

  @IsOptional()
  @IsISO8601()
  dateLivraison?: string | null;

  @IsOptional()
  @IsString()
  lieuActuel?: string | null;
}
