import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateThemeMarqueDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  couleurPrimaire?: string;

  @IsOptional()
  @IsString()
  couleurSecondaire?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateThemeMarqueDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  couleurPrimaire?: string;

  @IsOptional()
  @IsString()
  couleurSecondaire?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ThemeMarqueResponseDto {
  id: string;
  organisationId: string;
  nom: string;
  couleurPrimaire: string | null;
  couleurSecondaire: string | null;
  logoUrl: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
