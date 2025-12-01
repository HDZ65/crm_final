import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutClientDto } from './create-statut-client.dto';

export class UpdateStatutClientDto extends PartialType(CreateStatutClientDto) {}
