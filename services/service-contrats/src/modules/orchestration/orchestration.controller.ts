import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrchestrationService } from './orchestration.service';

import type {
  OrchestrationRequest,
  GetOrchestrationHistoryRequest,
} from '@crm/proto/contrats';

@Controller()
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @GrpcMethod('ContractOrchestrationService', 'Activate')
  async activateContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.activate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract activated successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Suspend')
  async suspendContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.suspend(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract suspended successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Terminate')
  async terminateContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.terminate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract terminated successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'PortIn')
  async portInContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.portIn(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract port-in completed successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'GetHistory')
  async getOrchestrationHistory(data: GetOrchestrationHistoryRequest) {
    const result = await this.orchestrationService.getHistory(data.contractId, data.pagination);
    return {
      history: result.history.map((h) => ({
        ...h,
        payload: h.payload ? JSON.stringify(h.payload) : '',
        responsePayload: h.responsePayload ? JSON.stringify(h.responsePayload) : '',
      })),
      pagination: result.pagination,
    };
  }
}
