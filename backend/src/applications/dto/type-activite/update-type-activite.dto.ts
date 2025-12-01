import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeActiviteDto } from './create-type-activite.dto';

export class UpdateTypeActiviteDto extends PartialType(CreateTypeActiviteDto) {}
