import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStatutCommissionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  ordreAffichage?: number;
}
