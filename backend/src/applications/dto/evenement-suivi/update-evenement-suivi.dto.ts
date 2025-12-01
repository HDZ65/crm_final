import { PartialType } from '@nestjs/mapped-types';
import { CreateEvenementSuiviDto } from './create-evenement-suivi.dto';

export class UpdateEvenementSuiviDto extends PartialType(
  CreateEvenementSuiviDto,
) {}
