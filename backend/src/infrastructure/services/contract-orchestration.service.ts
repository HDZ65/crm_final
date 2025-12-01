import { Injectable, Logger, Inject } from '@nestjs/common';
import type { ContractOrchestrationPort } from '../../core/port/contract-orchestration.port';
import type { ContractOrchestrationHistoryRepositoryPort } from '../../core/port/contract-orchestration-history-repository.port';
import type { ContratRepositoryPort } from '../../core/port/contrat-repository.port';
import type { StatutContratRepositoryPort } from '../../core/port/statut-contrat-repository.port';
import {
  ContractOrchestrationHistoryEntity,
  type OrchestrationOperation,
} from '../../core/domain/contract-orchestration-history.entity';

// Mapping des opérations vers les codes de statut
const OPERATION_TO_STATUT_CODE: Record<OrchestrationOperation, string> = {
  activate: 'actif',
  suspend: 'suspendu',
  terminate: 'resilie',
  port_in: 'actif',
};

@Injectable()
export class ContractOrchestrationService implements ContractOrchestrationPort {
  private readonly logger = new Logger(ContractOrchestrationService.name);

  constructor(
    @Inject('ContractOrchestrationHistoryRepositoryPort')
    private readonly historyRepository: ContractOrchestrationHistoryRepositoryPort,
    @Inject('ContratRepositoryPort')
    private readonly contratRepository: ContratRepositoryPort,
    @Inject('StatutContratRepositoryPort')
    private readonly statutContratRepository: StatutContratRepositoryPort,
  ) {}

  async activate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'activate', payload, async () => {
      this.logger.log(`Activating contract ${contractId}`, payload);
      await this.updateContractStatus(contractId, 'activate');
      return { previousStatus: payload?.previousStatus, newStatus: 'actif' };
    });
  }

  async suspend(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'suspend', payload, async () => {
      this.logger.log(`Suspending contract ${contractId}`, payload);
      await this.updateContractStatus(contractId, 'suspend');
      return { previousStatus: payload?.previousStatus, newStatus: 'suspendu' };
    });
  }

  async terminate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'terminate', payload, async () => {
      this.logger.log(`Terminating contract ${contractId}`, payload);
      await this.updateContractStatus(contractId, 'terminate');
      return { previousStatus: payload?.previousStatus, newStatus: 'resilie' };
    });
  }

  async portIn(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.executeOperation(contractId, 'port_in', payload, async () => {
      this.logger.log(`Processing port-in for contract ${contractId}`, payload);
      await this.updateContractStatus(contractId, 'port_in');
      return { previousStatus: payload?.previousStatus, newStatus: 'actif' };
    });
  }

  /**
   * Met à jour le statut du contrat en base de données
   */
  private async updateContractStatus(
    contractId: string,
    operation: OrchestrationOperation,
  ): Promise<void> {
    const statutCode = OPERATION_TO_STATUT_CODE[operation];

    // Récupérer tous les statuts et trouver celui qui correspond au code
    const statuts = await this.statutContratRepository.findAll();
    const targetStatut = statuts.find((s) => s.code === statutCode);

    if (!targetStatut) {
      throw new Error(
        `Statut contrat avec code "${statutCode}" non trouvé. Assurez-vous que les statuts sont configurés en base.`,
      );
    }

    // Récupérer le contrat actuel
    const contrat = await this.contratRepository.findById(contractId);
    if (!contrat) {
      throw new Error(`Contrat avec ID "${contractId}" non trouvé.`);
    }

    // Mettre à jour le statutId du contrat
    contrat.statutId = targetStatut.id;
    contrat.updatedAt = new Date();

    await this.contratRepository.update(contractId, contrat);

    this.logger.log(
      `Contract ${contractId} status updated to "${statutCode}" (statutId: ${targetStatut.id})`,
    );
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
