import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClientBaseDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  typeClient: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsOptional()
  @IsISO8601()
  dateNaissance?: string | null;

  @IsString()
  @IsNotEmpty()
  compteCode: string;

  @IsString()
  @IsNotEmpty()
  partenaireId: string;

  @IsISO8601()
  dateCreation: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  @IsString()
  statut?: string;
}
