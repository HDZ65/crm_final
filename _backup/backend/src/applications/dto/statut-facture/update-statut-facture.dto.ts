import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutFactureDto } from './create-statut-facture.dto';

export class UpdateStatutFactureDto extends PartialType(
  CreateStatutFactureDto,
) {}
