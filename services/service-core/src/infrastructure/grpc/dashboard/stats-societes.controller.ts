import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetStatsSocietesRequest, StatsSocietesResponse } from '@proto/dashboard';

@Controller()
export class StatsSocietesController {
  @GrpcMethod('StatsSocietesService', 'GetStatsSocietes')
  async getStatsSocietes(_: GetStatsSocietesRequest): Promise<StatsSocietesResponse> {
    return {
      societes: [],
      total: 0,
    };
  }
}
