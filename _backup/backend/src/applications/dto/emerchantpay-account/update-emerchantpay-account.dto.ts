import { PartialType } from '@nestjs/swagger';
import { CreateEmerchantpayAccountDto } from './create-emerchantpay-account.dto';

export class UpdateEmerchantpayAccountDto extends PartialType(CreateEmerchantpayAccountDto) {}
