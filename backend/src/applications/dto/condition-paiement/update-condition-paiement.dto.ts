import { PartialType } from '@nestjs/mapped-types';
import { CreateConditionPaiementDto } from './create-condition-paiement.dto';

export class UpdateConditionPaiementDto extends PartialType(
  CreateConditionPaiementDto,
) {}
