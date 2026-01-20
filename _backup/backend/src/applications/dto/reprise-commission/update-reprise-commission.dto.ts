import { PartialType } from '@nestjs/mapped-types';
import { CreateRepriseCommissionDto } from './create-reprise-commission.dto';
import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class UpdateRepriseCommissionDto extends PartialType(
  CreateRepriseCommissionDto,
) {
  @IsOptional()
  @IsIn(['en_attente', 'appliquee', 'annulee'])
  statutReprise?: string;

  @IsOptional()
  @IsDateString()
  dateApplication?: string | null;

  @IsOptional()
  @IsString()
  bordereauId?: string | null;
}
