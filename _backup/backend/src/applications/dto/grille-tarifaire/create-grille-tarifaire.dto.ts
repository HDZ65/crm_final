import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateGrilleTarifaireDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  dateDebut: string;

  @IsString()
  @IsNotEmpty()
  dateFin: string;

  @IsBoolean()
  estParDefaut: boolean;
}
