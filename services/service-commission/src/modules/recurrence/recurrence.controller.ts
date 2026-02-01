import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RecurrenceService } from './recurrence.service';
import { StatutRecurrence } from './entities/commission-recurrente.entity';

import type {
  GetRecurrencesRequest,
  GetRecurrencesByContratRequest,
  RecurrenceListResponse,
} from '@crm/proto/commission';

const grpcToStatutRecurrence = (n: number): StatutRecurrence | undefined => {
  const map: Record<number, StatutRecurrence> = {
    1: StatutRecurrence.ACTIVE,
    2: StatutRecurrence.SUSPENDUE,
    3: StatutRecurrence.TERMINEE,
    4: StatutRecurrence.ANNULEE,
  };
  return map[n];
};

@Controller()
export class RecurrenceController {
  constructor(private readonly service: RecurrenceService) {}

  @GrpcMethod('CommissionService', 'GetRecurrences')
  async list(req: GetRecurrencesRequest): Promise<RecurrenceListResponse> {
    try {
      const { recurrences, total } = await this.service.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        periode: req.periode,
        statut: req.statut ? grpcToStatutRecurrence(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { recurrences: recurrences as unknown as RecurrenceListResponse['recurrences'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetRecurrencesByContrat')
  async listByContrat(req: GetRecurrencesByContratRequest): Promise<RecurrenceListResponse> {
    try {
      const recurrences = await this.service.findByContrat(req.organisationId, req.contratId);
      return { recurrences: recurrences as unknown as RecurrenceListResponse['recurrences'], total: recurrences.length };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
