import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateConditionPaiementDto {
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
  delaiJours: number;
}
