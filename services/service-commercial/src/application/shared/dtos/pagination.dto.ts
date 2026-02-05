import { IsOptional, IsNumber, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class PaginationResponseDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
