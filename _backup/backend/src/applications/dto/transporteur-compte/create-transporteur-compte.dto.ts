import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateTransporteurCompteDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  labelFormat: string;

  @IsBoolean()
  actif: boolean;
}
