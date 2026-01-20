import { PartialType } from '@nestjs/mapped-types';
import { CreateColisDto } from './create-colis.dto';

export class UpdateColisDto extends PartialType(CreateColisDto) {}
