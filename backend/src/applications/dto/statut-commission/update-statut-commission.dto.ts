import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutCommissionDto } from './create-statut-commission.dto';

export class UpdateStatutCommissionDto extends PartialType(
  CreateStatutCommissionDto,
) {}
