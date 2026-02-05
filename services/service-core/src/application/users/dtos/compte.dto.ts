import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCompteDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  etat?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

export class UpdateCompteDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  etat?: string;
}

export class CompteResponseDto {
  id: string;
  nom: string;
  etat: string;
  dateCreation: Date;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
