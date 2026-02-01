import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolePermissionService } from './role-permission.service';

import type {
  CreateRolePermissionRequest,
  GetRolePermissionRequest,
  ListByRoleRequest,
  DeleteRolePermissionRequest,
} from '@crm/proto/users';

@Controller()
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @GrpcMethod('RolePermissionService', 'Create')
  async create(data: CreateRolePermissionRequest) {
    return this.rolePermissionService.create(data);
  }

  @GrpcMethod('RolePermissionService', 'Get')
  async get(data: GetRolePermissionRequest) {
    return this.rolePermissionService.findById(data.id);
  }

  @GrpcMethod('RolePermissionService', 'ListByRole')
  async listByRole(data: ListByRoleRequest) {
    return this.rolePermissionService.findByRole(data.roleId, data.pagination);
  }

  @GrpcMethod('RolePermissionService', 'Delete')
  async delete(data: DeleteRolePermissionRequest) {
    const success = await this.rolePermissionService.delete(data.id);
    return { success };
  }
}
