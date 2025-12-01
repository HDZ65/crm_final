import { PartialType } from '@nestjs/mapped-types';
import { CreateModeleDistributionDto } from './create-modele-distribution.dto';

export class UpdateModeleDistributionDto extends PartialType(
  CreateModeleDistributionDto,
) {}
