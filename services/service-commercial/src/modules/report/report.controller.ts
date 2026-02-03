import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReportNegatifService } from './report.service';
import { StatutReport } from './entities/report-negatif.entity';

import type {
  GetReportsNegatifsRequest,
  ReportNegatifListResponse,
} from '@crm/proto/commission';

const grpcToStatutReport = (n: number): StatutReport | undefined => {
  const map: Record<number, StatutReport> = {
    1: StatutReport.EN_COURS,
    2: StatutReport.APURE,
    3: StatutReport.ANNULE,
  };
  return map[n];
};

@Controller()
export class ReportController {
  constructor(private readonly service: ReportNegatifService) {}

  @GrpcMethod('CommissionService', 'GetReportsNegatifs')
  async list(req: GetReportsNegatifsRequest): Promise<ReportNegatifListResponse> {
    try {
      const { reports, total } = await this.service.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        statut: req.statut ? grpcToStatutReport(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { reports: reports as unknown as ReportNegatifListResponse['reports'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
