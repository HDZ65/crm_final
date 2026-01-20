import { PartialType } from '@nestjs/swagger';
import { CreateSlimpayAccountDto } from './create-slimpay-account.dto';

export class UpdateSlimpayAccountDto extends PartialType(CreateSlimpayAccountDto) {}
