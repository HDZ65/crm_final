import { PartialType } from '@nestjs/mapped-types';
import { CreateApporteurDto } from './create-apporteur.dto';

export class UpdateApporteurDto extends PartialType(CreateApporteurDto) {}
