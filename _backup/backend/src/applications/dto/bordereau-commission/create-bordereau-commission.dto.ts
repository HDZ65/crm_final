import { IsString, IsOptional } from 'class-validator';

export class CreateBordereauCommissionDto {
  @IsString()
  organisationId: string;

  @IsString()
  reference: string;

  @IsString()
  periode: string;

  @IsString()
  apporteurId: string;

  @IsOptional()
  @IsString()
  commentaire?: string | null;

  @IsOptional()
  @IsString()
  creePar?: string | null;
}
