import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateStatutClientDto {
  @IsString()
  code: string;

  @IsString()
  libelle: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateStatutClientDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  libelle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class StatutClientResponseDto {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
