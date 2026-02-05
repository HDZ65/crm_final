import { IsString, IsUUID, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateExpeditionDto {
  @IsUUID()
  organisationId: string;

  @IsUUID()
  clientBaseId: string;

  @IsUUID()
  transporteurCompteId: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsString()
  trackingNumber: string;

  @IsString()
  labelUrl: string;

  @IsString()
  referenceCommande: string;

  @IsOptional()
  @IsUUID()
  produitId?: string;

  @IsOptional()
  @IsString()
  nomProduit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poids?: number;

  @IsOptional()
  @IsString()
  adresseDestination?: string;

  @IsOptional()
  @IsString()
  villeDestination?: string;

  @IsOptional()
  @IsString()
  codePostalDestination?: string;

  @IsOptional()
  @IsDateString()
  dateExpedition?: string;

  @IsOptional()
  @IsDateString()
  dateLivraisonEstimee?: string;
}

export class UpdateExpeditionDto {
  @IsOptional()
  @IsString()
  etat?: string;

  @IsOptional()
  @IsString()
  lieuActuel?: string;

  @IsOptional()
  @IsDateString()
  dateLivraison?: string;
}

export class ExpeditionResponseDto {
  id: string;
  organisationId: string;
  clientBaseId: string;
  transporteurCompteId: string;
  contratId?: string;
  trackingNumber: string;
  etat: string;
  dateCreation: string;
  dateDernierStatut: string;
  labelUrl: string;
  referenceCommande: string;
  produitId?: string;
  nomProduit?: string;
  poids?: number;
  adresseDestination?: string;
  villeDestination?: string;
  codePostalDestination?: string;
  dateExpedition?: string;
  dateLivraisonEstimee?: string;
  dateLivraison?: string;
  lieuActuel?: string;
  createdAt: string;
  updatedAt: string;
}
