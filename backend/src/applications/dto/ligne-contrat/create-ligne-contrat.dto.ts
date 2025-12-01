import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLigneContratDto {
  @IsNumber()
  quantite: number;

  @IsNumber()
  prixUnitaire: number;

  @IsString()
  @IsNotEmpty()
  contratId: string;

  @IsString()
  @IsNotEmpty()
  periodeFacturationId: string;

  @IsString()
  @IsNotEmpty()
  produitId: string;
}
