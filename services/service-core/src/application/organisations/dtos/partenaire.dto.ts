import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreatePartenaireDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdatePartenaireDto {
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
  code?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class PartenaireResponseDto {
  id: string;
  organisationId: string;
  nom: string;
  description: string | null;
  code: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PartenaireFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
