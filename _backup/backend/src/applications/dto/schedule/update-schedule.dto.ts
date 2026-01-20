import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsString,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ScheduleStatus, PSPName } from '../../../core/domain/payment.enums';

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  societeId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  produitId?: string;

  // Payment info
  @IsEnum(PSPName)
  @IsOptional()
  pspName?: PSPName;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  // Scheduling
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsIn(['day', 'week', 'month', 'year'])
  @IsOptional()
  intervalUnit?: 'day' | 'week' | 'month' | 'year';

  @IsNumber()
  @IsOptional()
  intervalCount?: number;

  // Status
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @IsNumber()
  @IsOptional()
  retryCount?: number;

  @IsNumber()
  @IsOptional()
  maxRetries?: number;

  @IsDateString()
  @IsOptional()
  lastFailureAt?: string;

  @IsString()
  @IsOptional()
  lastFailureReason?: string;

  // PSP references
  @IsString()
  @IsOptional()
  pspMandateId?: string;

  @IsString()
  @IsOptional()
  pspCustomerId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
