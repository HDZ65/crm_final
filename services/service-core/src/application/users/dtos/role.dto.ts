import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RoleResponseDto {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
