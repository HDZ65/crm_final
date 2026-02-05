import { IsString, IsOptional, IsUUID, IsBoolean, IsEnum, IsNumber, IsEmail, IsDateString } from 'class-validator';

export enum Fournisseur {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  EXCHANGE = 'exchange',
  SMTP = 'smtp',
  OTHER = 'other',
}

export enum TypeConnexion {
  OAUTH2 = 'oauth2',
  SMTP_IMAP = 'smtp_imap',
}

export class CreateBoiteMailDto {
  @IsString()
  nom: string;

  @IsEmail()
  adresseEmail: string;

  @IsOptional()
  @IsEnum(Fournisseur)
  fournisseur?: Fournisseur;

  @IsOptional()
  @IsEnum(TypeConnexion)
  typeConnexion?: TypeConnexion;

  @IsOptional()
  @IsString()
  serveurSMTP?: string;

  @IsOptional()
  @IsNumber()
  portSMTP?: number;

  @IsOptional()
  @IsString()
  serveurIMAP?: string;

  @IsOptional()
  @IsNumber()
  portIMAP?: number;

  @IsOptional()
  @IsBoolean()
  utiliseSsl?: boolean;

  @IsOptional()
  @IsBoolean()
  utiliseTls?: boolean;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  motDePasse?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiration?: string;

  @IsOptional()
  @IsString()
  signatureHtml?: string;

  @IsOptional()
  @IsString()
  signatureTexte?: string;

  @IsOptional()
  @IsBoolean()
  estParDefaut?: boolean;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsUUID()
  utilisateurId: string;
}

export class UpdateBoiteMailDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsEmail()
  adresseEmail?: string;

  @IsOptional()
  @IsEnum(Fournisseur)
  fournisseur?: Fournisseur;

  @IsOptional()
  @IsEnum(TypeConnexion)
  typeConnexion?: TypeConnexion;

  @IsOptional()
  @IsString()
  serveurSMTP?: string;

  @IsOptional()
  @IsNumber()
  portSMTP?: number;

  @IsOptional()
  @IsString()
  serveurIMAP?: string;

  @IsOptional()
  @IsNumber()
  portIMAP?: number;

  @IsOptional()
  @IsBoolean()
  utiliseSsl?: boolean;

  @IsOptional()
  @IsBoolean()
  utiliseTls?: boolean;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  motDePasse?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiration?: string;

  @IsOptional()
  @IsString()
  signatureHtml?: string;

  @IsOptional()
  @IsString()
  signatureTexte?: string;

  @IsOptional()
  @IsBoolean()
  estParDefaut?: boolean;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class BoiteMailResponseDto {
  id: string;
  nom: string;
  adresseEmail: string;
  fournisseur: Fournisseur;
  typeConnexion: TypeConnexion;
  serveurSMTP: string | null;
  portSMTP: number | null;
  serveurIMAP: string | null;
  portIMAP: number | null;
  utiliseSsl: boolean;
  utiliseTls: boolean;
  username: string | null;
  signatureHtml: string | null;
  signatureTexte: string | null;
  estParDefaut: boolean;
  actif: boolean;
  utilisateurId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BoiteMailFiltersDto {
  @IsOptional()
  @IsUUID()
  utilisateurId?: string;

  @IsOptional()
  @IsEnum(Fournisseur)
  fournisseur?: Fournisseur;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
