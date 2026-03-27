import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TypeActiviteService } from '../persistence/typeorm/repositories/engagement';
import type {
  TypeActivite as TypeActiviteProto,
  CreateTypeActiviteRequest,
  UpdateTypeActiviteRequest,
  GetTypeActiviteRequest,
  GetTypeActiviteByCodeRequest,
  ListTypeActiviteRequest,
  ListTypeActiviteResponse,
  DeleteTypeActiviteRequest,
  DeleteResponse,
} from '@proto/activites';

@Controller()
export class TypeActiviteController {
  constructor(private readonly typeActiviteService: TypeActiviteService) {}

  @GrpcMethod('TypeActiviteService', 'Create')
  async create(data: CreateTypeActiviteRequest): Promise<TypeActiviteProto> {
    return this.typeActiviteService.create(data);
  }

  @GrpcMethod('TypeActiviteService', 'Update')
  async update(data: UpdateTypeActiviteRequest): Promise<TypeActiviteProto> {
    const { id, ...updateData } = data;
    return this.typeActiviteService.update(id, updateData);
  }

  @GrpcMethod('TypeActiviteService', 'Get')
  async get(data: GetTypeActiviteRequest): Promise<TypeActiviteProto> {
    return this.typeActiviteService.findById(data.id);
  }

  @GrpcMethod('TypeActiviteService', 'GetByCode')
  async getByCode(data: GetTypeActiviteByCodeRequest): Promise<TypeActiviteProto> {
    return this.typeActiviteService.findByCode(data.code);
  }

  @GrpcMethod('TypeActiviteService', 'List')
  async list(data: ListTypeActiviteRequest): Promise<ListTypeActiviteResponse> {
    return this.typeActiviteService.findAll(data.pagination);
  }

  @GrpcMethod('TypeActiviteService', 'Delete')
  async delete(data: DeleteTypeActiviteRequest): Promise<DeleteResponse> {
    const success = await this.typeActiviteService.delete(data.id);
    return { success };
  }
}
