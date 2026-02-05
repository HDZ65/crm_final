import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CatalogService } from './catalog.service';

import type {
  GetCatalogRequest,
  CalculatePriceRequest,
} from '@crm/proto/products';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @GrpcMethod('CatalogService', 'GetCatalog')
  async getCatalog(data: GetCatalogRequest) {
    return this.catalogService.getCatalog(data);
  }

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest) {
    return this.catalogService.calculatePrice(data);
  }
}
