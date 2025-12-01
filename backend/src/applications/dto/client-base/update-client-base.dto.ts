import { PartialType } from '@nestjs/mapped-types';
import { CreateClientBaseDto } from './create-client-base.dto';

export class UpdateClientBaseDto extends PartialType(CreateClientBaseDto) {}
