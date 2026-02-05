import { IsString, IsOptional, IsBoolean, IsUUID, IsEmail } from 'class-validator';

export class CreateApporteurDto {
  @IsUUID()
  organisationId: string;

  @IsOptional()
  @IsUUID()
  utilisateurId?: string;

  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsString()
  typeApporteur: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateApporteurDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  typeApporteur?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ApporteurResponseDto {
  id: string;
  organisationId: string;
  utilisateurId: string | null;
  nom: string;
  prenom: string;
  typeApporteur: string;
  email: string | null;
  telephone: string | null;
  societeId: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApporteurFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
