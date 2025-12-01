import { PartialType } from '@nestjs/mapped-types';
import { CreateMembreGroupeDto } from './create-membre-groupe.dto';

export class UpdateMembreGroupeDto extends PartialType(CreateMembreGroupeDto) {}
