import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoleService } from '../../../../infrastructure/persistence/typeorm/repositories/users/role.service';

import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRoleRequest,
  GetRoleByCodeRequest,
  ListRoleRequest,
  DeleteRoleRequest,
} from '@crm/proto/users';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @GrpcMethod('RoleService', 'Create')
  async create(data: CreateRoleRequest) {
    return this.roleService.create(data);
  }

  @GrpcMethod('RoleService', 'Update')
  async update(data: UpdateRoleRequest) {
    return this.roleService.update(data);
  }

  @GrpcMethod('RoleService', 'Get')
  async get(data: GetRoleRequest) {
    return this.roleService.findById(data.id);
  }

  @GrpcMethod('RoleService', 'GetByCode')
  async getByCode(data: GetRoleByCodeRequest) {
    return this.roleService.findByCode(data.code);
  }

  @GrpcMethod('RoleService', 'List')
  async list(data: ListRoleRequest) {
    return this.roleService.findAll(data.pagination);
  }

  @GrpcMethod('RoleService', 'Delete')
  async delete(data: DeleteRoleRequest) {
    const success = await this.roleService.delete(data.id);
    return { success };
  }
}
