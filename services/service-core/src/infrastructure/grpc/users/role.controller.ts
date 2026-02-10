import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoleService } from '../../persistence/typeorm/repositories/users/role.service';
import { RoleEntity } from '../../../domain/users/entities';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRoleRequest,
  GetRoleByCodeRequest,
  ListRoleRequest,
  ListRoleResponse,
  DeleteRoleRequest,
  Role,
  DeleteResponse,
} from '@proto/users';

/**
 * Map RoleEntity (camelCase) to proto Role (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function roleToProto(entity: RoleEntity) {
  return {
    id: entity.id,
    code: entity.code,
    nom: entity.nom,
    description: entity.description ?? '',
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @GrpcMethod('RoleService', 'Create')
  async create(data: CreateRoleRequest) {
    const entity = await this.roleService.create(data);
    return roleToProto(entity);
  }

  @GrpcMethod('RoleService', 'Update')
  async update(data: UpdateRoleRequest) {
    const entity = await this.roleService.update(data);
    return roleToProto(entity);
  }

  @GrpcMethod('RoleService', 'Get')
  async get(data: GetRoleRequest) {
    const entity = await this.roleService.findById(data.id);
    return roleToProto(entity);
  }

  @GrpcMethod('RoleService', 'GetByCode')
  async getByCode(data: GetRoleByCodeRequest) {
    const entity = await this.roleService.findByCode(data.code);
    return roleToProto(entity);
  }

  @GrpcMethod('RoleService', 'List')
  async list(data: ListRoleRequest) {
    const result = await this.roleService.findAll(data.pagination);
    return {
      roles: result.roles.map(roleToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RoleService', 'Delete')
  async delete(data: DeleteRoleRequest) {
    const success = await this.roleService.delete(data.id);
    return { success };
  }
}
