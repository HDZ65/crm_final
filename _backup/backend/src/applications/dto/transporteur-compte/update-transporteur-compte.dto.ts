import { PartialType } from '@nestjs/mapped-types';
import { CreateTransporteurCompteDto } from './create-transporteur-compte.dto';

export class UpdateTransporteurCompteDto extends PartialType(
  CreateTransporteurCompteDto,
) {}
