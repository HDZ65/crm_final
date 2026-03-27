import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DashboardService } from '../../persistence/typeorm/repositories/dashboard/dashboard.service';
import type {
  GetKpisCommerciauxRequest,
  KpisCommerciauxResponse,
} from '@proto/dashboard';

@Controller()
export class KpisCommerciauxController {
  private readonly logger = new Logger(KpisCommerciauxController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @GrpcMethod('KpisCommerciauxService', 'GetKpisCommerciaux')
  async getKpisCommerciaux(data: GetKpisCommerciauxRequest): Promise<KpisCommerciauxResponse> {
    this.logger.log(`GetKpisCommerciaux called for org=${data.filters?.organisation_id}`);
    const filters = data.filters ?? { organisation_id: '' };
    return this.dashboardService.getKpisCommerciaux(filters);
  }
}
