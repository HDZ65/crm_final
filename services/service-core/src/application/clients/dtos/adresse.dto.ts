import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAdresseDto {
  @IsUUID()
  clientBaseId: string;

  @IsString()
  ligne1: string;

  @IsOptional()
  @IsString()
  ligne2?: string;

  @IsString()
  codePostal: string;

  @IsString()
  ville: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsString()
  type: string;
}

export class UpdateAdresseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  ligne1?: string;

  @IsOptional()
  @IsString()
  ligne2?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class AdresseResponseDto {
  id: string;
  clientBaseId: string;
  ligne1: string;
  ligne2: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}
