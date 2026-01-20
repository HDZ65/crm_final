import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodeFacturationDto } from './create-periode-facturation.dto';

export class UpdatePeriodeFacturationDto extends PartialType(
  CreatePeriodeFacturationDto,
) {}
