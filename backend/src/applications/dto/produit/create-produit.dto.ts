import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateProduitDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  actif: boolean;
}
