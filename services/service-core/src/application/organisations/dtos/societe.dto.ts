import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSocieteDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  raisonSociale: string;

  @IsString()
  siren: string;

  @IsString()
  numeroTva: string;
}

export class UpdateSocieteDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  raisonSociale?: string;

  @IsOptional()
  @IsString()
  siren?: string;

  @IsOptional()
  @IsString()
  numeroTva?: string;
}

export class SocieteResponseDto {
  id: string;
  organisationId: string;
  raisonSociale: string;
  siren: string;
  numeroTva: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SocieteFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
