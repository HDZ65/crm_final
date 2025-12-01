import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMembrePartenaireDto {
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;

  @IsString()
  @IsNotEmpty()
  partenaireMarqueBlancheId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
