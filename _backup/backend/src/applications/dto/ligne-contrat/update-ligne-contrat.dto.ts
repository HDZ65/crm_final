import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneContratDto } from './create-ligne-contrat.dto';

export class UpdateLigneContratDto extends PartialType(CreateLigneContratDto) {}
