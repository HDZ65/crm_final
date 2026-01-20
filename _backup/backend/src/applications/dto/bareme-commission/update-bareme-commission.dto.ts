import { PartialType } from '@nestjs/mapped-types';
import { CreateBaremeCommissionDto } from './create-bareme-commission.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBaremeCommissionDto extends PartialType(
  CreateBaremeCommissionDto,
) {
  @IsOptional()
  @IsString()
  modifiePar?: string | null;

  @IsOptional()
  @IsString()
  motifModification?: string | null;
}
