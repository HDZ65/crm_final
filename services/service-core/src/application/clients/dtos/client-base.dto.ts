import { IsString, IsEmail, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { AdresseResponseDto } from './adresse.dto';

export class CreateClientBaseDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  typeClient: string;

  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsString()
  compteCode: string;

  @IsUUID()
  partenaireId: string;

  @IsString()
  telephone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;
}

export class UpdateClientBaseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  typeClient?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsString()
  compteCode?: string;

  @IsOptional()
  @IsUUID()
  partenaireId?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;
}

export class ClientBaseResponseDto {
  id: string;
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance: Date | null;
  compteCode: string;
  partenaireId: string;
  dateCreation: Date;
  telephone: string;
  email: string | null;
  statut: string;
  societeId: string | null;
  adresses?: AdresseResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class ClientBaseFiltersDto {
  @IsUUID()
  organisationId: string;

  @IsOptional()
  @IsString()
  statutId?: string;

  @IsOptional()
  @IsUUID()
  societeId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
