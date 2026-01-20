import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePartenaireMarqueBlancheDto {
  @IsString()
  @IsNotEmpty()
  denomination: string;

  @IsString()
  @IsNotEmpty()
  siren: string;

  @IsString()
  @IsNotEmpty()
  numeroTVA: string;

  @IsString()
  @IsNotEmpty()
  contactSupportEmail: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsString()
  @IsNotEmpty()
  statutId: string;
}
