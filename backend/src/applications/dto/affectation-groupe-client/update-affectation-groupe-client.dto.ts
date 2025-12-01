import { PartialType } from '@nestjs/mapped-types';
import { CreateAffectationGroupeClientDto } from './create-affectation-groupe-client.dto';

export class UpdateAffectationGroupeClientDto extends PartialType(
  CreateAffectationGroupeClientDto,
) {}
