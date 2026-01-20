import { PartialType } from '@nestjs/mapped-types';
import { CreateGrilleTarifaireDto } from './create-grille-tarifaire.dto';

export class UpdateGrilleTarifaireDto extends PartialType(
  CreateGrilleTarifaireDto,
) {}
