import { PartialType } from '@nestjs/mapped-types';
import { CreateMembreCompteDto } from './create-membre-compte.dto';

export class UpdateMembreCompteDto extends PartialType(CreateMembreCompteDto) {}
