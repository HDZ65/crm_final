import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GammeService } from './gamme.service';

import type {
  CreateGammeRequest,
  UpdateGammeRequest,
  GetGammeRequest,
  ListGammesRequest,
  DeleteGammeRequest,
} from '@crm/proto/products';

@Controller()
export class GammeController {
  constructor(private readonly gammeService: GammeService) {}

  @GrpcMethod('GammeService', 'Create')
  async create(data: CreateGammeRequest) {
    return this.gammeService.create(data);
  }

  @GrpcMethod('GammeService', 'Update')
  async update(data: UpdateGammeRequest) {
    return this.gammeService.update(data);
  }

  @GrpcMethod('GammeService', 'Get')
  async get(data: GetGammeRequest) {
    return this.gammeService.findById(data);
  }

  @GrpcMethod('GammeService', 'List')
  async list(data: ListGammesRequest) {
    return this.gammeService.findAll(data);
  }

  @GrpcMethod('GammeService', 'Delete')
  async delete(data: DeleteGammeRequest) {
    const success = await this.gammeService.delete(data);
    return { success };
  }
}
