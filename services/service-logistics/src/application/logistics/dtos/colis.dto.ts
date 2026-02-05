import { IsString, IsNumber, IsUUID, IsOptional, Min } from 'class-validator';

export class CreateColisDto {
  @IsUUID()
  expeditionId: string;

  @IsNumber()
  @Min(0)
  poidsGr: number;

  @IsNumber()
  @Min(0)
  longCm: number;

  @IsNumber()
  @Min(0)
  largCm: number;

  @IsNumber()
  @Min(0)
  hautCm: number;

  @IsNumber()
  @Min(0)
  valeurDeclaree: number;

  @IsString()
  contenu: string;
}

export class UpdateColisDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsGr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  longCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hautCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurDeclaree?: number;

  @IsOptional()
  @IsString()
  contenu?: string;
}

export class ColisResponseDto {
  id: string;
  expeditionId: string;
  poidsGr: number;
  longCm: number;
  largCm: number;
  hautCm: number;
  valeurDeclaree: number;
  contenu: string;
  createdAt: string;
  updatedAt: string;
}
