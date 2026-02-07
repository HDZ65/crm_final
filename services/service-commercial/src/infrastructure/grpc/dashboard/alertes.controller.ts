import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DashboardService } from '../../persistence/typeorm/repositories/dashboard/dashboard.service';
import type {
  GetAlertesRequest,
  AlertesResponse,
} from '@proto/dashboard';

@Controller()
export class AlertesController {
  private readonly logger = new Logger(AlertesController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @GrpcMethod('AlertesService', 'GetAlertes')
  async getAlertes(data: GetAlertesRequest): Promise<AlertesResponse> {
    this.logger.log(`GetAlertes called for org=${data.filters?.organisation_id}`);
    const filters = data.filters ?? { organisation_id: '' };
    return this.dashboardService.getAlertes(filters);
  }
}
