import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFacturationParDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
