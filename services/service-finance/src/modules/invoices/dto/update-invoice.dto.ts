import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../entities/invoice-status.enum';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

/**
 * DTO pour la mise à jour d'une facture
 * ATTENTION: Ne peut être utilisé que si status = DRAFT
 * Les factures VALIDATED sont IMMUTABLES
 */
export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  @IsOptional()
  items?: CreateInvoiceItemDto[];
}
