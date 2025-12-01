import { PartialType } from '@nestjs/mapped-types';
import { CreateHistoriqueStatutContratDto } from './create-historique-statut-contrat.dto';

export class UpdateHistoriqueStatutContratDto extends PartialType(
  CreateHistoriqueStatutContratDto,
) {}
