import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupeEntiteDto } from './create-groupe-entite.dto';

export class UpdateGroupeEntiteDto extends PartialType(
  CreateGroupeEntiteDto,
) {}
