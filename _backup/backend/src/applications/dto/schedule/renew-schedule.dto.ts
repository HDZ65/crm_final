import { IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenewScheduleDto {
  @ApiProperty({
    description: 'New amount for the renewed contract (in base currency unit, e.g., EUR)',
    example: 35.0,
  })
  @IsNumber()
  @IsNotEmpty()
  newAmount: number;

  @ApiPropertyOptional({
    description: 'New contract end date (ISO 8601 format). If not provided, contract has no end date.',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  newContractEndDate?: string;

  @ApiPropertyOptional({
    description: 'New due date for the next payment (ISO 8601 format). Defaults to today if not provided.',
    example: '2025-02-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  newDueDate?: string;
}
