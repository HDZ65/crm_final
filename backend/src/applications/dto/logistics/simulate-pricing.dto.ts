import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SimulatePricingDto {
  @IsString()
  @IsNotEmpty()
  serviceLevel: string;

  @IsString()
  @IsNotEmpty()
  format: string;

  @IsNumber()
  weightGr: number;

  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @IsString()
  @IsNotEmpty()
  destinationCountry: string;
}
