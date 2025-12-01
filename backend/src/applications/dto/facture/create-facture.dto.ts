import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFactureDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsNotEmpty()
  dateEmission: string;

  @IsNumber()
  montantHT: number;

  @IsNumber()
  montantTTC: number;

  @IsString()
  @IsNotEmpty()
  statutId: string;

  @IsString()
  @IsNotEmpty()
  emissionFactureId: string;

  @IsString()
  @IsNotEmpty()
  clientBaseId: string;

  @IsOptional()
  @IsString()
  contratId?: string | null;

  @IsString()
  @IsNotEmpty()
  clientPartenaireId: string;

  @IsString()
  @IsNotEmpty()
  adresseFacturationId: string;
}
