import { IsNotEmpty, IsString } from 'class-validator';

export class CreateActiviteDto {
  @IsString()
  @IsNotEmpty()
  typeId: string;

  @IsString()
  @IsNotEmpty()
  dateActivite: string;

  @IsString()
  @IsNotEmpty()
  sujet: string;

  @IsString()
  @IsNotEmpty()
  commentaire: string;

  @IsString()
  @IsNotEmpty()
  echeance: string;

  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsString()
  @IsNotEmpty()
  contratId: string;

  @IsString()
  @IsNotEmpty()
  clientPartenaireId: string;
}
