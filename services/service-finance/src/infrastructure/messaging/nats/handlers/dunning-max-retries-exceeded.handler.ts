import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
} from '../../../../domain/payments/entities/schedule.entity';
import type { IImsClient } from '../../../external/ims/ims-client.interface';
import { IMS_CLIENT_TOKEN } from '../../../external/ims/ims-client.interface';

/**
 * Payload received on dunning.max_retries_exceeded subject.
 */
export interface DunningMaxRetriesExceededEvent {
  subscriptionId: string;
  scheduleId: string;
  clientId: string;
  organisationId: string;
  retryPolicyId: string;
  totalAttempts: number;
  lastFailureCode?: string;
  /** ISO timestamp */
  occurredAt: string;
}

/**
 * NATS handler for dunning.max_retries_exceeded.
 *
 * When all CB retry attempts have been exhausted:
 * 1. Calls IMS mock client to notify suspension
 * 2. Transitions the subscription schedule to SUSPENDED (paused)
 */
@Injectable()
export class DunningMaxRetriesExceededHandler implements OnModuleInit {
  private readonly logger = new Logger(DunningMaxRetriesExceededHandler.name);

  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @Inject(IMS_CLIENT_TOKEN)
    private readonly imsClient: IImsClient,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'DunningMaxRetriesExceededHandler initialized — ready for dunning.max_retries_exceeded',
    );
    // TODO: Wire NATS subscription when nats-utils transport is available.
    // await this.natsService.subscribeProto('dunning.max_retries_exceeded', this.handle.bind(this));
  }

  async handle(event: DunningMaxRetriesExceededEvent): Promise<void> {
    this.logger.log(
      `Processing dunning.max_retries_exceeded: schedule=${event.scheduleId} client=${event.clientId}`,
    );

    try {
      // 1. Notify IMS of suspension
      const imsResult = await this.imsClient.notifySuspension({
        subscriptionId: event.subscriptionId,
        clientId: event.clientId,
        organisationId: event.organisationId,
        reason: `MAX_RETRIES_EXCEEDED (attempts=${event.totalAttempts}, lastCode=${event.lastFailureCode ?? 'N/A'})`,
        effectiveDate: new Date().toISOString(),
      });

      this.logger.log(
        `IMS suspension notified: ack=${imsResult.acknowledged} ref=${imsResult.externalRef ?? 'N/A'}`,
      );

      // 2. Transition schedule to SUSPENDED (paused)
      const schedule = await this.scheduleRepository.findOne({
        where: { id: event.scheduleId },
      });

      if (!schedule) {
        this.logger.warn(
          `Schedule ${event.scheduleId} not found — cannot transition to SUSPENDED`,
        );
        return;
      }

      schedule.status = ScheduleStatus.PAUSED;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        suspendedByDunning: true,
        suspendedAt: new Date().toISOString(),
        imsExternalRef: imsResult.externalRef ?? null,
        totalRetryAttempts: event.totalAttempts,
        lastFailureCode: event.lastFailureCode ?? null,
      };

      await this.scheduleRepository.save(schedule);

      this.logger.log(
        `Schedule ${event.scheduleId} transitioned to SUSPENDED after max retries exceeded`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process dunning.max_retries_exceeded for schedule ${event.scheduleId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
