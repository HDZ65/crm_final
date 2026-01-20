import { IsOptional, IsBoolean, IsDateString, IsString } from 'class-validator';

export class UpdatePaymentEventDto {
  @IsBoolean()
  @IsOptional()
  processed?: boolean;

  @IsDateString()
  @IsOptional()
  processedAt?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}
