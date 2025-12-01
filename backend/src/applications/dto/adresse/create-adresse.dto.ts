import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdresseDto {
  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsString()
  @IsNotEmpty()
  ligne1: string;

  @IsOptional()
  @IsString()
  ligne2?: string | null;

  @IsString()
  @IsNotEmpty()
  codePostal: string;

  @IsString()
  @IsNotEmpty()
  ville: string;

  @IsString()
  @IsNotEmpty()
  pays: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
