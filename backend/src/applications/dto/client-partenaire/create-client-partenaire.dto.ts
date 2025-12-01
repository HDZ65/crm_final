import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClientPartenaireDto {
  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsString()
  @IsNotEmpty()
  partenaireId: string;

  @IsString()
  @IsNotEmpty()
  rolePartenaireId: string;

  @IsString()
  @IsNotEmpty()
  validFrom: string;

  @IsString()
  @IsNotEmpty()
  validTo: string;
}
