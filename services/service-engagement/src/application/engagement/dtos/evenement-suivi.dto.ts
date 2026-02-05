import { IsString, IsOptional, IsUUID, IsDate } from 'class-validator';

export class CreateEvenementSuiviDto {
  @IsUUID()
  expeditionId: string;

  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsDate()
  dateEvenement: Date;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsOptional()
  raw?: Record<string, any>;
}

export class UpdateEvenementSuiviDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsDate()
  dateEvenement?: Date;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsOptional()
  raw?: Record<string, any>;
}

export class EvenementSuiviResponseDto {
  id: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: Date;
  lieu: string | null;
  raw: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}
