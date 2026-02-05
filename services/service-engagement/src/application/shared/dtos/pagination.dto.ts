import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginationResponseDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
