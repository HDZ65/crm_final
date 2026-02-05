import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IPermissionService {
  create(dto: CreatePermissionDto): Promise<PermissionResponseDto>;
  update(dto: UpdatePermissionDto): Promise<PermissionResponseDto>;
  findById(id: string): Promise<PermissionResponseDto>;
  findByCode(code: string): Promise<PermissionResponseDto>;
  findAll(pagination?: PaginationDto): Promise<{
    permissions: PermissionResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const PERMISSION_SERVICE = Symbol('IPermissionService');
