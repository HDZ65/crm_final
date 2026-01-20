import { PartialType } from '@nestjs/swagger';
import { CreateMultisafepayAccountDto } from './create-multisafepay-account.dto';

export class UpdateMultisafepayAccountDto extends PartialType(CreateMultisafepayAccountDto) {}
