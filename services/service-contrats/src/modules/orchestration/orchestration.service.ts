import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  OrchestrationHistoryEntity,
  OrchestrationOperation,
  OrchestrationStatus,
} from './entities/orchestration-history.entity';
import { ContratService } from '../contrat/contrat.service';
import { StatutContratService } from '../statut-contrat/statut-contrat.service';
import { HistoriqueStatutContratService } from '../historique-statut-contrat/historique-statut-contrat.service';
import { PaymentClientService } from './payment-client.service';

const OPERATION_STATUS_MAP: Record<OrchestrationOperation, string> = {
  activate: 'actif',
  suspend: 'suspendu',
  terminate: 'resilie',
  port_in: 'actif',
};

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    @InjectRepository(OrchestrationHistoryEntity)
    private readonly historyRepository: Repository<OrchestrationHistoryEntity>,
    private readonly contratService: ContratService,
    private readonly statutContratService: StatutContratService,
    private readonly historiqueStatutService: HistoriqueStatutContratService,
    private readonly paymentClient: PaymentClientService,
    private readonly configService: ConfigService,
  ) {}

  async activate(contractId: string, payload?: Record<string, unknown>): Promise<OrchestrationHistoryEntity> {
    return this.executeOperation('activate', contractId, payload);
  }

  async suspend(contractId: string, payload?: Record<string, unknown>): Promise<OrchestrationHistoryEntity> {
    return this.executeOperation('suspend', contractId, payload);
  }

  async terminate(contractId: string, payload?: Record<string, unknown>): Promise<OrchestrationHistoryEntity> {
    return this.executeOperation('terminate', contractId, payload);
  }

  async portIn(contractId: string, payload?: Record<string, unknown>): Promise<OrchestrationHistoryEntity> {
    return this.executeOperation('port_in', contractId, payload);
  }

  async getHistory(
    contractId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    history: OrchestrationHistoryEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const [history, total] = await this.historyRepository.findAndCount({
      where: { contractId },
      order: { startedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { history, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private async executeOperation(
    operation: OrchestrationOperation,
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<OrchestrationHistoryEntity> {
    // Create pending history record
    const historyEntry = this.historyRepository.create({
      contractId,
      operation,
      status: 'pending' as OrchestrationStatus,
      payload: payload || null,
      startedAt: new Date(),
    });
    await this.historyRepository.save(historyEntry);

    try {
      // Get current contract
      const contrat = await this.contratService.findById(contractId);
      const oldStatut = contrat.statut;
      const newStatutCode = OPERATION_STATUS_MAP[operation];

      // Get statut entities for history
      let ancienStatutId: string | null = null;
      let nouveauStatutId: string | null = null;

      try {
        const ancienStatut = await this.statutContratService.findByCode(oldStatut);
        ancienStatutId = ancienStatut.id;
      } catch {
        this.logger.warn(`Old status code ${oldStatut} not found in statut_contrat table`);
      }

      try {
        const nouveauStatut = await this.statutContratService.findByCode(newStatutCode);
        nouveauStatutId = nouveauStatut.id;
      } catch {
        this.logger.warn(`New status code ${newStatutCode} not found in statut_contrat table`);
      }

      await this.contratService.updateStatus(contractId, newStatutCode);

      if (operation === 'activate' && payload?.paymentMethod === 'sepa') {
        await this.setupSepaMandateForContract(contrat);
      }

      if (ancienStatutId && nouveauStatutId) {
        await this.historiqueStatutService.create({
          contratId: contractId,
          ancienStatutId,
          nouveauStatutId,
          dateChangement: new Date().toISOString(),
        });
      }

      // Update history as success
      historyEntry.status = 'success';
      historyEntry.responsePayload = {
        oldStatus: oldStatut,
        newStatus: newStatutCode,
        contractReference: contrat.reference,
      };
      historyEntry.finishedAt = new Date();

      this.logger.log(`Contract ${contractId} ${operation} completed: ${oldStatut} -> ${newStatutCode}`);
    } catch (error: any) {
      // Update history as failure
      historyEntry.status = 'failure';
      historyEntry.errorMessage = error.message || 'Unknown error';
      historyEntry.finishedAt = new Date();

      this.logger.error(`Contract ${contractId} ${operation} failed: ${error.message}`);
    }

    return this.historyRepository.save(historyEntry);
  }

  private async setupSepaMandateForContract(contrat: any): Promise<void> {
    const redirectBaseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'https://app.example.com',
    );

    const mandateResult = await this.paymentClient.setupMandateForContract({
      societeId: contrat.societeId,
      clientId: contrat.clientId,
      contratId: contrat.id,
      contratReference: contrat.reference,
      redirectBaseUrl,
    });

    if (mandateResult) {
      this.logger.log(
        `SEPA mandate initiated for contract ${contrat.reference}: ${mandateResult.mandateId}`,
      );
    } else {
      this.logger.warn(
        `Failed to setup SEPA mandate for contract ${contrat.reference} - will need manual setup`,
      );
    }
  }
}
