import { PartialType } from '@nestjs/mapped-types';
import { CreateClientPartenaireDto } from './create-client-partenaire.dto';

export class UpdateClientPartenaireDto extends PartialType(
  CreateClientPartenaireDto,
) {}
