import { Inject, Injectable, Optional } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import { ContratStatus } from '../entities/contrat-status.enum';
import type { ContratEntity } from '../entities/contrat.entity';
import type { IContratRepository } from '../repositories/IContratRepository';

export interface ContratHistoryService {
  create(input: {
    contratId: string;
    ancienStatut: string;
    nouveauStatut: string;
    dateChangement: string;
  }): Promise<any>;
}

export interface ContratNatsPublisher {
  publishStatusChanged(input: {
    contratId: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    triggeredBy: string;
  }): Promise<void>;
}

@Injectable()
export class ContratLifecycleService {
  constructor(
    @Inject('IContratRepository')
    private readonly repository: IContratRepository,
    private readonly historyService: ContratHistoryService,
    @Optional() private readonly publisher?: ContratNatsPublisher,
  ) {}

  async activate(
    contratId: string,
    input: { reason?: string; triggeredBy: string },
  ): Promise<ContratEntity> {
    return this.transition({
      contratId,
      targetStatus: ContratStatus.ACTIVE,
      allowedFrom: [ContratStatus.DRAFT, ContratStatus.SUSPENDED],
      reason: input.reason,
      triggeredBy: input.triggeredBy,
    });
  }

  async suspend(
    contratId: string,
    input: { reason?: string; triggeredBy: string },
  ): Promise<ContratEntity> {
    return this.transition({
      contratId,
      targetStatus: ContratStatus.SUSPENDED,
      allowedFrom: [ContratStatus.ACTIVE],
      reason: input.reason,
      triggeredBy: input.triggeredBy,
    });
  }

  async terminate(
    contratId: string,
    input: { reason?: string; triggeredBy: string },
  ): Promise<ContratEntity> {
    return this.transition({
      contratId,
      targetStatus: ContratStatus.TERMINATED,
      allowedFrom: [ContratStatus.DRAFT, ContratStatus.ACTIVE, ContratStatus.SUSPENDED],
      reason: input.reason,
      triggeredBy: input.triggeredBy,
    });
  }

  async close(contratId: string, input: { triggeredBy: string }): Promise<ContratEntity> {
    return this.transition({
      contratId,
      targetStatus: ContratStatus.CLOSED,
      allowedFrom: [ContratStatus.ACTIVE],
      triggeredBy: input.triggeredBy,
    });
  }

  private async transition(input: {
    contratId: string;
    targetStatus: ContratStatus;
    allowedFrom: ContratStatus[];
    reason?: string;
    triggeredBy: string;
    onBeforeSave?: (entity: ContratEntity) => void;
  }): Promise<ContratEntity> {
    const entity = await this.repository.findById(input.contratId);
    if (!entity) {
      throw new DomainException(`Contrat ${input.contratId} not found`, 'CONTRAT_NOT_FOUND', {
        contratId: input.contratId,
      });
    }

    const currentStatus = entity.statut as ContratStatus;
    if (!input.allowedFrom.includes(currentStatus)) {
      throw new DomainException(
        `Invalid transition from ${currentStatus} to ${input.targetStatus}`,
        'CONTRAT_INVALID_STATUS_TRANSITION',
        {
          contratId: input.contratId,
          currentStatus,
          targetStatus: input.targetStatus,
          allowedFrom: input.allowedFrom,
        },
      );
    }

    entity.statut = input.targetStatus;
    input.onBeforeSave?.(entity);

    const saved = await this.repository.save(entity);

    await this.historyService.create({
      contratId: input.contratId,
      ancienStatut: currentStatus,
      nouveauStatut: input.targetStatus,
      dateChangement: new Date().toISOString(),
    });

    await this.publisher?.publishStatusChanged({
      contratId: input.contratId,
      previousStatus: currentStatus,
      newStatus: input.targetStatus,
      reason: input.reason,
      triggeredBy: input.triggeredBy,
    });

    return saved;
  }
}
