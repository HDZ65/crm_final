import { IsString, IsOptional } from 'class-validator';

export class CreateTypeActiviteDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTypeActiviteDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TypeActiviteResponseDto {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
