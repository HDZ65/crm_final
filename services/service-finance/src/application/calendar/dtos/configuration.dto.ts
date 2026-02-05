import { IsString, IsOptional, IsUUID, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../../../domain/calendar/entities/system-debit-configuration.entity';

export class CreateConfigurationDto {
  @IsUUID()
  organisationId: string;

  @IsEnum(DebitDateMode)
  mode: DebitDateMode;

  @IsOptional()
  @IsEnum(DebitBatch)
  batch?: DebitBatch;

  @IsOptional()
  @IsInt()
  fixedDay?: number;

  @IsOptional()
  @IsEnum(DateShiftStrategy)
  shiftStrategy?: DateShiftStrategy;

  @IsOptional()
  @IsUUID()
  holidayZoneId?: string;

  @IsOptional()
  @IsUUID()
  cutoffConfigId?: string;
}

export class UpdateConfigurationDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(DebitDateMode)
  mode?: DebitDateMode;

  @IsOptional()
  @IsEnum(DebitBatch)
  batch?: DebitBatch;

  @IsOptional()
  @IsInt()
  fixedDay?: number;

  @IsOptional()
  @IsEnum(DateShiftStrategy)
  shiftStrategy?: DateShiftStrategy;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ConfigurationResponseDto {
  id: string;
  organisationId: string;
  mode: DebitDateMode;
  batch: DebitBatch | null;
  fixedDay: number | null;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string | null;
  cutoffConfigId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
