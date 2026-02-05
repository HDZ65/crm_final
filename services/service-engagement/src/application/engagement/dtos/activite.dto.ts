import { IsString, IsOptional, IsUUID, IsDate } from 'class-validator';

export class CreateActiviteDto {
  @IsUUID()
  typeId: string;

  @IsDate()
  dateActivite: Date;

  @IsString()
  sujet: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsDate()
  echeance?: Date;

  @IsOptional()
  @IsUUID()
  clientBaseId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsUUID()
  clientPartenaireId?: string;
}

export class UpdateActiviteDto {
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsDate()
  dateActivite?: Date;

  @IsOptional()
  @IsString()
  sujet?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsDate()
  echeance?: Date;

  @IsOptional()
  @IsUUID()
  clientBaseId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsUUID()
  clientPartenaireId?: string;
}

export class ActiviteResponseDto {
  id: string;
  typeId: string;
  dateActivite: Date;
  sujet: string;
  commentaire: string | null;
  echeance: Date | null;
  clientBaseId: string | null;
  contratId: string | null;
  clientPartenaireId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
