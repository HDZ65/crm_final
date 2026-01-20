import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateColisDto {
  @IsString()
  @IsNotEmpty()
  expeditionId: string;

  @IsNumber()
  poidsGr: number;

  @IsNumber()
  longCm: number;

  @IsNumber()
  largCm: number;

  @IsNumber()
  hautCm: number;

  @IsNumber()
  valeurDeclaree: number;

  @IsString()
  @IsNotEmpty()
  contenu: string;
}
