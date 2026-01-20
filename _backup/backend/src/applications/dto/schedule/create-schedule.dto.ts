import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ScheduleStatus, PSPName } from '../../../core/domain/payment.enums';

export class CreateScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsUUID()
  @IsOptional()
  factureId?: string;

  @IsUUID()
  @IsOptional()
  contratId?: string;

  @IsUUID()
  @IsOptional()
  societeId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  produitId?: string;

  // Payment info
  @IsEnum(PSPName)
  @IsNotEmpty()
  pspName: PSPName;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  // Scheduling
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

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
  maxRetries?: number;

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
