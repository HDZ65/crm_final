import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IRoleService {
  create(dto: CreateRoleDto): Promise<RoleResponseDto>;
  update(dto: UpdateRoleDto): Promise<RoleResponseDto>;
  findById(id: string): Promise<RoleResponseDto>;
  findByCode(code: string): Promise<RoleResponseDto>;
  findAll(pagination?: PaginationDto): Promise<{
    roles: RoleResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const ROLE_SERVICE = Symbol('IRoleService');
