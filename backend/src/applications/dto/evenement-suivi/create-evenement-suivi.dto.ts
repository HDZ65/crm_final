import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEvenementSuiviDto {
  @IsString()
  @IsNotEmpty()
  expeditionId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  dateEvenement: string;

  @IsString()
  @IsNotEmpty()
  lieu: string;

  @IsString()
  @IsNotEmpty()
  raw: string;
}
