import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Length,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

// Transforme les chaînes vides en undefined (pour gRPC qui envoie '' au lieu de undefined)
const EmptyStringToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateInvoiceDto {
  // ========== CLIENT INFO (REQUIRED) ==========

  @IsString()
  @Length(1, 255)
  customerName: string;

  @IsString()
  @Length(1, 1000)
  customerAddress: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.customerSiret !== undefined)
  @Length(14, 14)
  customerSiret?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  customerTvaNumber?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsEmail()
  @ValidateIf((o) => o.customerEmail !== undefined)
  customerEmail?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  // ========== DATES (REQUIRED) ==========

  @IsDateString()
  issueDate: string;

  @IsDateString()
  deliveryDate: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.dueDate !== undefined)
  dueDate?: string;

  // ========== PAYMENT TERMS ==========

  @IsNumber()
  @Min(1)
  @IsOptional()
  paymentTermsDays?: number = 30;

  @IsNumber()
  @Min(0)
  @IsOptional()
  latePaymentInterestRate?: number = 13.5;

  @IsNumber()
  @IsOptional()
  recoveryIndemnity?: number = 40;

  // ========== OPTIONAL MENTIONS ==========

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  vatMention?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  notes?: string;

  // ========== ITEMS (REQUIRED) ==========

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
