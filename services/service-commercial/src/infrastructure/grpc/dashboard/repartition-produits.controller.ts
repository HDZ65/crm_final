import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DashboardService } from '../../persistence/typeorm/repositories/dashboard/dashboard.service';
import type {
  GetRepartitionProduitsRequest,
  RepartitionProduitsResponse,
} from '@proto/dashboard';

@Controller()
export class RepartitionProduitsController {
  private readonly logger = new Logger(RepartitionProduitsController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @GrpcMethod('RepartitionProduitsService', 'GetRepartitionProduits')
  async getRepartitionProduits(
    data: GetRepartitionProduitsRequest,
  ): Promise<RepartitionProduitsResponse> {
    this.logger.log(`GetRepartitionProduits called for org=${data.filters?.organisation_id}`);
    const filters = data.filters ?? { organisation_id: '' };
    return this.dashboardService.getRepartitionProduits(filters);
  }
}
