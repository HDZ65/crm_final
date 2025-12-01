import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePieceJointeDto {
  @IsString()
  @IsNotEmpty()
  nomFichier: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  dateUpload: string;
}
