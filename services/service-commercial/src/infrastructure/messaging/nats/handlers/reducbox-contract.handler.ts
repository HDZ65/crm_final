import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { ReducBoxLifecycleService } from '../../../../domain/reducbox/services/reducbox-lifecycle.service';
import { ReducBoxAccessRepositoryService } from '../../../persistence/typeorm/repositories/reducbox';
import { ReducBoxAccessStatus } from '../../../../domain/reducbox/entities/reducbox-access.entity';

/**
 * Handler for contract lifecycle events that affect ReducBox access.
 * - crm.contrat.suspended → suspends all active ReducBox accesses for the contract
 * - crm.contrat.activated → creates ReducBox access for the contract
 */
@Injectable()
export class ReducBoxContractHandler implements OnModuleInit {
  private readonly logger = new Logger(ReducBoxContractHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly lifecycleService: ReducBoxLifecycleService,
    private readonly accessRepository: ReducBoxAccessRepositoryService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('ReducBoxContractHandler initialized - subscribing to contract events');

    await this.natsService.subscribe(
      'crm.contrat.suspended',
      this.handleContractSuspended.bind(this),
    );

    await this.natsService.subscribe(
      'crm.contrat.activated',
      this.handleContractActivated.bind(this),
    );
  }

  private async handleContractSuspended(data: Record<string, unknown>): Promise<void> {
    this.logger.log('Received crm.contrat.suspended event for ReducBox');

    const contratId = (data?.contrat_id || data?.contratId) as string | undefined;
    if (!contratId) {
      this.logger.warn('crm.contrat.suspended event without contratId — skipping ReducBox suspension');
      return;
    }

    try {
      const access = await this.accessRepository.findByContratId(contratId);

      if (!access) {
        this.logger.log(`No ReducBox access found for contrat ${contratId} — nothing to suspend`);
        return;
      }

      if (access.status !== ReducBoxAccessStatus.ACTIVE) {
        this.logger.log(`ReducBox access ${access.id} is ${access.status}, not ACTIVE — skipping suspension`);
        return;
      }

      const reason = (data?.reason as string) || 'Contract suspended';
      await this.lifecycleService.suspendAccess(access.id, reason);

      this.logger.log(`ReducBox access ${access.id} suspended due to contract ${contratId} suspension`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to suspend ReducBox access for contrat ${contratId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleContractActivated(data: Record<string, unknown>): Promise<void> {
    this.logger.log('Received crm.contrat.activated event for ReducBox');

    const contratId = (data?.contrat_id || data?.contratId) as string | undefined;
    const clientId = (data?.client_id || data?.clientId) as string | undefined;

    if (!contratId || !clientId) {
      this.logger.warn(
        `crm.contrat.activated event missing contratId or clientId — skipping ReducBox creation. ` +
          `Keys: [${Object.keys(data || {}).join(', ')}]`,
      );
      return;
    }

    try {
      // Check if access already exists for this contract
      const existing = await this.accessRepository.findByContratId(contratId);
      if (existing) {
        if (existing.isSuspended()) {
          this.logger.log(`ReducBox access ${existing.id} exists but suspended — restoring`);
          await this.lifecycleService.restoreAccess(existing.id);
          return;
        }

        this.logger.log(`ReducBox access already exists for contrat ${contratId} (status=${existing.status}) — skipping`);
        return;
      }

      await this.lifecycleService.createAccess(clientId, contratId);
      this.logger.log(`ReducBox access created for contrat ${contratId}, client ${clientId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to create ReducBox access for contrat ${contratId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
