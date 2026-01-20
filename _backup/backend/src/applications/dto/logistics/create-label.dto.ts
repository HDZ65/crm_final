import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LogisticsAddressDto } from './address.dto';

export class CreateLabelDto {
  @IsOptional()
  @IsString()
  contractId?: string | null;

  @IsString()
  @IsNotEmpty()
  serviceLevel: string;

  @IsString()
  @IsNotEmpty()
  format: string;

  @IsNumber()
  weightGr: number;

  @ValidateNested()
  @Type(() => LogisticsAddressDto)
  sender: LogisticsAddressDto;

  @ValidateNested()
  @Type(() => LogisticsAddressDto)
  recipient: LogisticsAddressDto;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
