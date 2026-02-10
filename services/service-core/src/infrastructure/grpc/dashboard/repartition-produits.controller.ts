import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetRepartitionProduitsRequest, RepartitionProduitsResponse } from '@proto/dashboard';

@Controller()
export class RepartitionProduitsController {
  @GrpcMethod('RepartitionProduitsService', 'GetRepartitionProduits')
  async getRepartitionProduits(_: GetRepartitionProduitsRequest): Promise<RepartitionProduitsResponse> {
    return {
      ca_total: 0,
      produits: [],
    };
  }
}
