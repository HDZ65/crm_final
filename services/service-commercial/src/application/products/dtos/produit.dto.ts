import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { TypeProduit, CategorieProduit, StatutCycleProduit } from '../../../domain/products/entities/produit.entity';

export class CreateProduitDto {
  @IsUUID()
  organisationId: string;

  @IsOptional()
  @IsUUID()
  gammeId?: string;

  @IsString()
  sku: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CategorieProduit)
  categorie?: CategorieProduit;

  @IsOptional()
  @IsEnum(TypeProduit)
  type?: TypeProduit;

  @IsOptional()
  @IsNumber()
  prix?: number;

  @IsOptional()
  @IsNumber()
  tauxTva?: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateProduitDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  prix?: number;

  @IsOptional()
  @IsEnum(StatutCycleProduit)
  statutCycle?: StatutCycleProduit;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsBoolean()
  promotionActive?: boolean;

  @IsOptional()
  @IsNumber()
  prixPromotion?: number;
}

export class ProduitResponseDto {
  id: string;
  organisationId: string;
  gammeId: string | null;
  sku: string;
  nom: string;
  description: string | null;
  categorie: CategorieProduit;
  type: TypeProduit;
  prix: number;
  tauxTva: number;
  devise: string;
  actif: boolean;
  statutCycle: StatutCycleProduit;
  promotionActive: boolean;
  prixPromotion: number | null;
  dateDebutPromotion: Date | null;
  dateFinPromotion: Date | null;
  imageUrl: string | null;
  codeExterne: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProduitFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  gammeId?: string;

  @IsOptional()
  @IsEnum(CategorieProduit)
  categorie?: CategorieProduit;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
