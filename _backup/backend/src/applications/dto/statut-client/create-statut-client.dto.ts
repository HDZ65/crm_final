import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateStatutClientDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  ordreAffichage: number;
}
