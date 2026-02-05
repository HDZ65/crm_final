import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreatePieceJointeDto {
  @IsString()
  nomFichier: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  typeMime?: string;

  @IsOptional()
  @IsNumber()
  taille?: number;

  @IsOptional()
  @IsString()
  entiteType?: string;

  @IsOptional()
  @IsString()
  entiteId?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class UpdatePieceJointeDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  nomFichier?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  typeMime?: string;

  @IsOptional()
  @IsNumber()
  taille?: number;

  @IsOptional()
  @IsString()
  entiteType?: string;

  @IsOptional()
  @IsString()
  entiteId?: string;
}

export class PieceJointeResponseDto {
  id: string;
  nomFichier: string;
  url: string;
  typeMime: string;
  taille: number;
  entiteType: string;
  entiteId: string;
  dateUpload: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PieceJointeFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  typeMime?: string;

  @IsOptional()
  @IsString()
  entiteType?: string;

  @IsOptional()
  @IsString()
  entiteId?: string;
}
