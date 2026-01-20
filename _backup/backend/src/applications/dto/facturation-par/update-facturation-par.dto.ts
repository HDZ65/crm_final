import { PartialType } from '@nestjs/mapped-types';
import { CreateFacturationParDto } from './create-facturation-par.dto';

export class UpdateFacturationParDto extends PartialType(
  CreateFacturationParDto,
) {}
