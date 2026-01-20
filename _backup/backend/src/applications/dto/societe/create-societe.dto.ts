import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSocieteDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  raisonSociale: string;

  @IsString()
  @IsNotEmpty()
  siren: string;

  @IsString()
  @IsNotEmpty()
  numeroTVA: string;
}
