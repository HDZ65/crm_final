import { PartialType } from '@nestjs/mapped-types';
import { CreateMembrePartenaireDto } from './create-membre-partenaire.dto';

export class UpdateMembrePartenaireDto extends PartialType(
  CreateMembrePartenaireDto,
) {}
