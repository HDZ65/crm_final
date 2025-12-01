import { PartialType } from '@nestjs/mapped-types';
import { CreateEmissionFactureDto } from './create-emission-facture.dto';

export class UpdateEmissionFactureDto extends PartialType(
  CreateEmissionFactureDto,
) {}
