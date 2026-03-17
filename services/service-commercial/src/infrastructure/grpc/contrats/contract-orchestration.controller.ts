import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrchestrationHistoryEntity } from '../../../domain/contrats/entities/orchestration-history.entity';
import { ContratLifecycleService } from '../../../domain/contrats/services/contrat-lifecycle.service';

@Controller()
export class ContractOrchestrationController {
  private readonly logger = new Logger(ContractOrchestrationController.name);

  constructor(
    private readonly lifecycleService: ContratLifecycleService,
    @InjectRepository(OrchestrationHistoryEntity)
    private readonly orchestrationRepo: Repository<OrchestrationHistoryEntity>,
  ) {}

  @GrpcMethod('ContractOrchestrationService', 'Activate')
  async activate(request: {
    contract_id: string;
    payload: string;
  }): Promise<{ success: boolean; message: string; history_id: string }> {
    const parsed = JSON.parse(request.payload || '{}');
    const history = this.orchestrationRepo.create({
      contractId: request.contract_id,
      operation: 'activate',
      status: 'pending',
      payload: parsed,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
      responsePayload: null,
    });
    const savedHistory = await this.orchestrationRepo.save(history);

    try {
      await this.lifecycleService.activate(request.contract_id, {
        reason: parsed.reason,
        triggeredBy: parsed.triggeredBy ?? 'SYSTEM',
      });
      savedHistory.status = 'success';
      savedHistory.finishedAt = new Date();
      await this.orchestrationRepo.save(savedHistory);
      return { success: true, message: 'Contract activated', history_id: savedHistory.id };
    } catch (error: any) {
      savedHistory.status = 'failure';
      savedHistory.finishedAt = new Date();
      savedHistory.errorMessage = error.message;
      await this.orchestrationRepo.save(savedHistory);
      return { success: false, message: error.message, history_id: savedHistory.id };
    }
  }

  @GrpcMethod('ContractOrchestrationService', 'Suspend')
  async suspend(request: {
    contract_id: string;
    payload: string;
  }): Promise<{ success: boolean; message: string; history_id: string }> {
    const parsed = JSON.parse(request.payload || '{}');
    const history = this.orchestrationRepo.create({
      contractId: request.contract_id,
      operation: 'suspend',
      status: 'pending',
      payload: parsed,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
      responsePayload: null,
    });
    const savedHistory = await this.orchestrationRepo.save(history);

    try {
      await this.lifecycleService.suspend(request.contract_id, {
        reason: parsed.reason,
        triggeredBy: parsed.triggeredBy ?? 'SYSTEM',
      });
      savedHistory.status = 'success';
      savedHistory.finishedAt = new Date();
      await this.orchestrationRepo.save(savedHistory);
      return { success: true, message: 'Contract suspended', history_id: savedHistory.id };
    } catch (error: any) {
      savedHistory.status = 'failure';
      savedHistory.finishedAt = new Date();
      savedHistory.errorMessage = error.message;
      await this.orchestrationRepo.save(savedHistory);
      return { success: false, message: error.message, history_id: savedHistory.id };
    }
  }

  @GrpcMethod('ContractOrchestrationService', 'Terminate')
  async terminate(request: {
    contract_id: string;
    payload: string;
  }): Promise<{ success: boolean; message: string; history_id: string }> {
    const parsed = JSON.parse(request.payload || '{}');
    const history = this.orchestrationRepo.create({
      contractId: request.contract_id,
      operation: 'terminate',
      status: 'pending',
      payload: parsed,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
      responsePayload: null,
    });
    const savedHistory = await this.orchestrationRepo.save(history);

    try {
      await this.lifecycleService.terminate(request.contract_id, {
        reason: parsed.reason,
        triggeredBy: parsed.triggeredBy ?? 'SYSTEM',
      });
      savedHistory.status = 'success';
      savedHistory.finishedAt = new Date();
      await this.orchestrationRepo.save(savedHistory);
      return { success: true, message: 'Contract terminated', history_id: savedHistory.id };
    } catch (error: any) {
      savedHistory.status = 'failure';
      savedHistory.finishedAt = new Date();
      savedHistory.errorMessage = error.message;
      await this.orchestrationRepo.save(savedHistory);
      return { success: false, message: error.message, history_id: savedHistory.id };
    }
  }

  @GrpcMethod('ContractOrchestrationService', 'PortIn')
  async portIn(request: {
    contract_id: string;
    payload: string;
  }): Promise<{ success: boolean; message: string; history_id: string }> {
    const parsed = JSON.parse(request.payload || '{}');
    const history = this.orchestrationRepo.create({
      contractId: request.contract_id,
      operation: 'port_in',
      status: 'pending',
      payload: parsed,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
      responsePayload: null,
    });
    const savedHistory = await this.orchestrationRepo.save(history);

    try {
      await this.lifecycleService.activate(request.contract_id, {
        reason: parsed.reason ?? 'Port-in activation',
        triggeredBy: parsed.triggeredBy ?? 'SYSTEM',
      });
      savedHistory.status = 'success';
      savedHistory.finishedAt = new Date();
      await this.orchestrationRepo.save(savedHistory);
      return { success: true, message: 'Contract port-in completed', history_id: savedHistory.id };
    } catch (error: any) {
      savedHistory.status = 'failure';
      savedHistory.finishedAt = new Date();
      savedHistory.errorMessage = error.message;
      await this.orchestrationRepo.save(savedHistory);
      return { success: false, message: error.message, history_id: savedHistory.id };
    }
  }

  @GrpcMethod('ContractOrchestrationService', 'GetHistory')
  async getHistory(request: {
    contract_id: string;
    pagination?: { page?: number; limit?: number };
  }): Promise<{
    history: any[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 20;

    const [items, total] = await this.orchestrationRepo.findAndCount({
      where: { contractId: request.contract_id },
      order: { startedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      history: items.map((h) => ({
        id: h.id,
        contract_id: h.contractId,
        operation: h.operation,
        status: h.status,
        payload: h.payload ? JSON.stringify(h.payload) : '',
        response_payload: h.responsePayload ? JSON.stringify(h.responsePayload) : '',
        error_message: h.errorMessage ?? '',
        started_at: h.startedAt?.toISOString() ?? '',
        finished_at: h.finishedAt?.toISOString() ?? '',
        created_at: h.createdAt?.toISOString() ?? '',
      })),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
