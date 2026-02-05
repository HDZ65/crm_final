import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolePartenaireService } from '../../../../infrastructure/persistence/typeorm/repositories/organisations/role-partenaire.service';

import type {
  CreateRolePartenaireRequest,
  UpdateRolePartenaireRequest,
  GetRolePartenaireRequest,
  GetRolePartenaireByCodeRequest,
  ListRolePartenaireRequest,
  DeleteRolePartenaireRequest,
} from '@crm/proto/organisations';

@Controller()
export class RolePartenaireController {
  constructor(private readonly rolePartenaireService: RolePartenaireService) {}

  @GrpcMethod('RolePartenaireService', 'Create')
  async create(data: CreateRolePartenaireRequest) {
    return this.rolePartenaireService.create(data);
  }

  @GrpcMethod('RolePartenaireService', 'Update')
  async update(data: UpdateRolePartenaireRequest) {
    return this.rolePartenaireService.update(data);
  }

  @GrpcMethod('RolePartenaireService', 'Get')
  async get(data: GetRolePartenaireRequest) {
    return this.rolePartenaireService.findById(data.id);
  }

  @GrpcMethod('RolePartenaireService', 'GetByCode')
  async getByCode(data: GetRolePartenaireByCodeRequest) {
    return this.rolePartenaireService.findByCode(data.code);
  }

  @GrpcMethod('RolePartenaireService', 'List')
  async list(data: ListRolePartenaireRequest) {
    return this.rolePartenaireService.findAll(data.pagination);
  }

  @GrpcMethod('RolePartenaireService', 'Delete')
  async delete(data: DeleteRolePartenaireRequest) {
    const success = await this.rolePartenaireService.delete(data.id);
    return { success };
  }
}
