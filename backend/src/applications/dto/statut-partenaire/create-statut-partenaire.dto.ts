import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateStatutPartenaireDto {
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
