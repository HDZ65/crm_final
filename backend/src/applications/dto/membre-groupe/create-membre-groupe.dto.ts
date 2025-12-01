import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMembreGroupeDto {
  @IsString()
  @IsNotEmpty()
  membreCompteId: string;

  @IsString()
  @IsNotEmpty()
  groupeId: string;

  @IsString()
  @IsNotEmpty()
  roleLocal: string;
}
