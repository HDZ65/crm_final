import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompteDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  etat?: string;

  @IsString()
  @IsOptional()
  dateCreation?: string;

  @IsString()
  @IsOptional()
  createdByUserId?: string;

  @IsString()
  @IsOptional()
  ownerRoleId?: string; // Rôle à assigner au créateur du compte
}
