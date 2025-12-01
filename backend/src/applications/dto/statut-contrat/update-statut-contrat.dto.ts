import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutContratDto } from './create-statut-contrat.dto';

export class UpdateStatutContratDto extends PartialType(
  CreateStatutContratDto,
) {}
