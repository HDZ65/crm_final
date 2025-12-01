import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutPartenaireDto } from './create-statut-partenaire.dto';

export class UpdateStatutPartenaireDto extends PartialType(
  CreateStatutPartenaireDto,
) {}
