import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHistoriqueStatutContratDto {
  @IsString()
  @IsNotEmpty()
  contratId: string;

  @IsString()
  @IsNotEmpty()
  ancienStatutId: string;

  @IsString()
  @IsNotEmpty()
  nouveauStatutId: string;

  @IsString()
  @IsNotEmpty()
  dateChangement: string;
}
