import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMembreCompteDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  etat: string;

  @IsOptional()
  @IsString()
  dateInvitation?: string | null;

  @IsOptional()
  @IsString()
  dateActivation?: string | null;
}
