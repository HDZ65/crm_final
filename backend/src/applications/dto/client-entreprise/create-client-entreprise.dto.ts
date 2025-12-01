import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClientEntrepriseDto {
  @IsString()
  @IsNotEmpty()
  raisonSociale: string;

  @IsString()
  @IsNotEmpty()
  numeroTVA: string;

  @IsString()
  @IsNotEmpty()
  siren: string;
}
