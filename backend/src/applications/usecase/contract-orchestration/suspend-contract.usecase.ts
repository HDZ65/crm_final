import { Injectable, Inject } from '@nestjs/common';
import type { ContractOrchestrationPort } from '../../../core/port/contract-orchestration.port';
import { OrchestrationCommandDto } from '../../dto/contract-orchestration/orchestration-command.dto';

@Injectable()
export class SuspendContractUseCase {
  constructor(
    @Inject('ContractOrchestrationPort')
    private readonly orchestrationPort: ContractOrchestrationPort,
  ) {}

  async execute(
    contractId: string,
    dto: OrchestrationCommandDto,
  ): Promise<void> {
    await this.orchestrationPort.suspend(contractId, dto.payload);
  }
}
