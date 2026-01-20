import { PartialType } from '@nestjs/mapped-types';
import { CreateRolePartenaireDto } from './create-role-partenaire.dto';

export class UpdateRolePartenaireDto extends PartialType(
  CreateRolePartenaireDto,
) {}
