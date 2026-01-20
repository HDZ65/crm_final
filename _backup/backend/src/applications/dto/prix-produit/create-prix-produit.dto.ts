import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePrixProduitDto {
  @IsNumber()
  prix: number;

  @IsString()
  @IsNotEmpty()
  periodeFacturationId: string;

  @IsNumber()
  remisePourcent: number;

  @IsString()
  @IsNotEmpty()
  produitId: string;

  @IsString()
  @IsNotEmpty()
  grilleTarifaireId: string;
}
