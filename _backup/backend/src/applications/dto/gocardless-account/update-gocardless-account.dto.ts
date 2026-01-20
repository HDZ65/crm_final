import { PartialType } from '@nestjs/swagger';
import { CreateGoCardlessAccountDto } from './create-gocardless-account.dto';

export class UpdateGoCardlessAccountDto extends PartialType(CreateGoCardlessAccountDto) {}
