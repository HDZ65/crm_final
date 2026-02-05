import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber } from 'class-validator';

export class CreateGammeDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icone?: string;

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateGammeDto {
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
  icone?: string;

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class GammeResponseDto {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;
  icone: string | null;
  ordre: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GammeFiltersDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
