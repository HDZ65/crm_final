import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class CreateGoCardlessSubscriptionDto {
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
  name?: string;

  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  @IsOptional()
  intervalUnit?: 'weekly' | 'monthly' | 'yearly';

  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  dayOfMonth?: number;

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class GoCardlessSubscriptionResponseDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  name?: string;
  intervalUnit: string;
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  mandateId: string;
  createdAt: string;
  upcomingPayments?: Array<{
    chargeDate: string;
    amount: number;
  }>;

  constructor(subscription: any) {
    this.id = subscription.id;
    this.amount = subscription.amount;
    this.currency = subscription.currency;
    this.status = subscription.status;
    this.name = subscription.name;
    this.intervalUnit = subscription.interval_unit;
    this.dayOfMonth = subscription.day_of_month;
    this.startDate = subscription.start_date;
    this.endDate = subscription.end_date;
    this.mandateId = subscription.links?.mandate;
    this.createdAt = subscription.created_at;
    this.upcomingPayments = subscription.upcoming_payments?.map((p: any) => ({
      chargeDate: p.charge_date,
      amount: p.amount,
    }));
  }
}
