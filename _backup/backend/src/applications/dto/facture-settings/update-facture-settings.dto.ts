import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFactureSettingsDto } from './create-facture-settings.dto';

export class UpdateFactureSettingsDto extends PartialType(
  OmitType(CreateFactureSettingsDto, ['societeId'] as const),
) {}
