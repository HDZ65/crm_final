import { PartialType } from '@nestjs/mapped-types';
import { CreatePartenaireMarqueBlancheDto } from './create-partenaire-marque-blanche.dto';

export class UpdatePartenaireMarqueBlancheDto extends PartialType(
  CreatePartenaireMarqueBlancheDto,
) {}
