import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FactureFiltersDto {
  @IsOptional()
  @IsString()
  organisationId?: string;

  @IsOptional()
  @IsString()
  clientBaseId?: string;

  @IsOptional()
  @IsString()
  statutId?: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
