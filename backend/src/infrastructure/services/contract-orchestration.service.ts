import { Injectable, Logger, Inject } from '@nestjs/common';
import type { ContractOrchestrationPort } from '../../core/port/contract-orchestration.port';
import type { ContractOrchestrationHistoryRepositoryPort } from '../../core/port/contract-orchestration-history-repository.port';
import {
  ContractOrchestrationHistoryEntity,
  type OrchestrationOperation,
} from '../../core/domain/contract-orchestration-history.entity';

@Injectable()
export class ContractOrchestrationService implements ContractOrchestrationPort {
  private readonly logger = new Logger(ContractOrchestrationService.name);

  constructor(
    @Inject('ContractOrchestrationHistoryRepositoryPort')
    private readonly historyRepository: ContractOrchestrationHistoryRepositoryPort,
  ) {}

  async activate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'activate', payload, () => {
      this.logger.log(`Activating contract ${contractId}`, payload);
    });
  }

  async suspend(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'suspend', payload, () => {
      this.logger.log(`Suspending contract ${contractId}`, payload);
    });
  }

  async terminate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'terminate', payload, () => {
      this.logger.log(`Terminating contract ${contractId}`, payload);
    });
  }

  async portIn(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'port_in', payload, () => {
      this.logger.log(`Processing port-in for contract ${contractId}`, payload);
    });
  }

  private async executeOperation(
    contractId: string,
    operation: OrchestrationOperation,
    payload: Record<string, unknown> | undefined,
    handler: () =>
      | Promise<Record<string, unknown> | void>
      | Record<string, unknown>
      | void,
  ): Promise<void> {
    const history = new ContractOrchestrationHistoryEntity({
      contractId,
      operation,
      status: 'pending',
      payload: payload ?? null,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.historyRepository.create(history);

    try {
      const result = handler();
      const resolved = result instanceof Promise ? await result : result;

      saved.status = 'success';
      saved.responsePayload =
        resolved && typeof resolved === 'object' ? resolved : null;
      saved.finishedAt = new Date();
      saved.updatedAt = new Date();
      await this.historyRepository.update(saved.id, saved);
    } catch (error) {
      saved.status = 'failure';
      saved.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      saved.finishedAt = new Date();
      saved.updatedAt = new Date();
      await this.historyRepository.update(saved.id, saved);
      throw error;
    }
  }
}
