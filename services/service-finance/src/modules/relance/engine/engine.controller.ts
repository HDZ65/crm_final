import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RelanceEngineService, RelanceEventData } from './relance-engine.service';
import { RegleRelanceService } from '../regle-relance/regle-relance.service';
import { RelanceDeclencheur } from '../regle-relance/entities/regle-relance.entity';
import type {
  ExecuteRelancesRequest,
  ExecuteRegleRequest,
  ProcessEventRequest,
  GetStatistiquesRequest,
} from '@crm/proto/relance';

const declencheurFromProto: Record<number, RelanceDeclencheur> = {
  1: RelanceDeclencheur.IMPAYE,
  2: RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE,
  3: RelanceDeclencheur.CONTRAT_EXPIRE,
  4: RelanceDeclencheur.NOUVEAU_CLIENT,
  5: RelanceDeclencheur.INACTIVITE_CLIENT,
};

@Controller()
export class EngineController {
  constructor(
    private readonly engineService: RelanceEngineService,
    private readonly regleRelanceService: RegleRelanceService,
  ) {}

  @GrpcMethod('RelanceEngineService', 'ExecuteRelances')
  async executeRelances(data: ExecuteRelancesRequest) {
    return this.engineService.executeRelances(data.organisation_id);
  }

  @GrpcMethod('RelanceEngineService', 'ExecuteRegle')
  async executeRegle(data: ExecuteRegleRequest) {
    const regle = await this.regleRelanceService.findById(data.regle_id);
    const result = await this.engineService.executeRegle(regle);
    return {
      success: result.success,
      message: result.success ? 'Regle executed' : 'Execution failed',
      actions_creees: result.actionsCreees,
    };
  }

  @GrpcMethod('RelanceEngineService', 'ProcessEvent')
  async processEvent(data: ProcessEventRequest) {
    let metadata: Record<string, unknown> | undefined;
    if (data.event?.metadata) {
      try {
        metadata = JSON.parse(data.event.metadata) as Record<string, unknown>;
      } catch {
        metadata = undefined;
      }
    }

    const eventData: RelanceEventData = {
      organisationId: data.event?.organisation_id || '',
      declencheur: declencheurFromProto[data.event?.declencheur || 0] || RelanceDeclencheur.IMPAYE,
      clientId: data.event?.client_id,
      contratId: data.event?.contrat_id,
      factureId: data.event?.facture_id,
      metadata,
    };

    const result = await this.engineService.processEvent(eventData);
    return {
      success: result.success,
      message: result.message,
      actions_created: result.actionsCreated.map((a) => JSON.stringify(a)),
    };
  }

  @GrpcMethod('RelanceEngineService', 'GetStatistiques')
  async getStatistiques(data: GetStatistiquesRequest) {
    return this.engineService.getStatistiques(
      data.organisation_id,
      data.date_from ? new Date(data.date_from) : undefined,
      data.date_to ? new Date(data.date_to) : undefined,
    );
  }
}
