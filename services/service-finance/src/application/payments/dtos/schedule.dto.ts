import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsDate } from 'class-validator';
import { ScheduleStatus, ScheduleFrequency, PaymentProvider } from '../../../domain/payments/entities/schedule.entity';

export class CreateScheduleDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  societeId: string;

  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  contratId?: string;

  @IsOptional()
  @IsUUID()
  factureId?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsUUID()
  providerAccountId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;
}

export class UpdateScheduleDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDate()
  nextPaymentDate?: Date;
}

export class ScheduleResponseDto {
  id: string;
  organisationId: string | null;
  clientId: string;
  societeId: string;
  contratId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  frequency: ScheduleFrequency;
  status: ScheduleStatus;
  startDate: Date;
  endDate: Date | null;
  nextPaymentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
