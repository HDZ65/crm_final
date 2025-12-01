import { PartialType } from '@nestjs/mapped-types';
import { CreateClientEntrepriseDto } from './create-client-entreprise.dto';

export class UpdateClientEntrepriseDto extends PartialType(
  CreateClientEntrepriseDto,
) {}
