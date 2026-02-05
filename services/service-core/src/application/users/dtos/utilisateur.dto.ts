import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateUtilisateurDto {
  @IsString()
  keycloakId: string;

  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateUtilisateurDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UtilisateurResponseDto {
  id: string;
  keycloakId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UtilisateurFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
