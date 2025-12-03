import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateProduitDto {
  @Matches(UUID_REGEX, { message: 'societeId doit être un UUID valide' })
  @IsNotEmpty()
  societeId: string;

  @Matches(UUID_REGEX, { message: 'gammeId doit être un UUID valide' })
  @IsOptional()
  gammeId?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  categorie?: string;

  @IsString()
  @IsIn(['Interne', 'Partenaire'])
  type: 'Interne' | 'Partenaire';

  @IsNumber()
  prix: number;

  @IsNumber()
  @IsOptional()
  tauxTVA?: number;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsString()
  @IsOptional()
  fournisseur?: string;

  @IsBoolean()
  actif: boolean;

  // Champs promotion
  @IsBoolean()
  @IsOptional()
  promotionActive?: boolean;

  @IsNumber()
  @IsOptional()
  promotionPourcentage?: number;

  @IsString()
  @IsOptional()
  promotionDateDebut?: string;

  @IsString()
  @IsOptional()
  promotionDateFin?: string;
}
