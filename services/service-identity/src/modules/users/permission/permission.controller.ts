import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PermissionService } from './permission.service';

import type {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetPermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRequest,
  DeletePermissionRequest,
} from '@crm/proto/users';

@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @GrpcMethod('PermissionService', 'Create')
  async create(data: CreatePermissionRequest) {
    return this.permissionService.create(data);
  }

  @GrpcMethod('PermissionService', 'Update')
  async update(data: UpdatePermissionRequest) {
    return this.permissionService.update(data);
  }

  @GrpcMethod('PermissionService', 'Get')
  async get(data: GetPermissionRequest) {
    return this.permissionService.findById(data.id);
  }

  @GrpcMethod('PermissionService', 'GetByCode')
  async getByCode(data: GetPermissionByCodeRequest) {
    return this.permissionService.findByCode(data.code);
  }

  @GrpcMethod('PermissionService', 'List')
  async list(data: ListPermissionRequest) {
    return this.permissionService.findAll(data.pagination);
  }

  @GrpcMethod('PermissionService', 'Delete')
  async delete(data: DeletePermissionRequest) {
    const success = await this.permissionService.delete(data.id);
    return { success };
  }
}
