import { PartialType } from '@nestjs/swagger';
import { CreateBoiteMailDto } from './create-boite-mail.dto';

export class UpdateBoiteMailDto extends PartialType(CreateBoiteMailDto) {}
