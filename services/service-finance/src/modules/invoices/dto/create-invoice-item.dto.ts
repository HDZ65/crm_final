import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsOptional,
  Length,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  @Length(1, 500)
  description: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @Length(1, 50)
  @IsOptional()
  unit?: string = 'pièce';

  @IsNumber()
  @IsPositive()
  unitPriceHT: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number = 0;
}
