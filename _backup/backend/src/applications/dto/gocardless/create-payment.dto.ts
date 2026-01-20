import { IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, Min } from 'class-validator';

export class CreateGoCardlessPaymentDto {
  @IsString()
  @IsNotEmpty()
  mandateId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class GoCardlessPaymentResponseDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  chargeDate: string;
  reference?: string;
  mandateId: string;
  createdAt: string;

  constructor(payment: any) {
    this.id = payment.id;
    this.amount = payment.amount;
    this.currency = payment.currency;
    this.status = payment.status;
    this.chargeDate = payment.charge_date;
    this.reference = payment.reference;
    this.mandateId = payment.links?.mandate;
    this.createdAt = payment.created_at;
  }
}
