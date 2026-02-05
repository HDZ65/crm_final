import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateOrganisationDto {
  @IsOptional()
  @IsUUID()
  id?: string; // Optional: for synchronization with other services

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateOrganisationDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsString()
  etat?: string;
}

export class OrganisationResponseDto {
  id: string;
  nom: string;
  description: string | null;
  siret: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  etat: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganisationFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
