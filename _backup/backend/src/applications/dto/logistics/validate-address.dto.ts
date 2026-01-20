import { LogisticsAddressDto } from './address.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateAddressDto extends LogisticsAddressDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => LogisticsAddressDto)
  address?: LogisticsAddressDto;
}
