import { PartialType } from '@nestjs/mapped-types';
import { CreatePalierCommissionDto } from './create-palier-commission.dto';

export class UpdatePalierCommissionDto extends PartialType(
  CreatePalierCommissionDto,
) {}
