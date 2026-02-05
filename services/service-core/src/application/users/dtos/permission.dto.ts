import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePermissionDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PermissionResponseDto {
  id: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
