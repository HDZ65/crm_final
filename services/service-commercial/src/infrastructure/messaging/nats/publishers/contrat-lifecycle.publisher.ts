import { Injectable, Logger, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { randomUUID } from 'crypto';

/**
 * Payload for contract status change events
 */
interface ContratStatusChangedPayload {
  contratId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  triggeredBy: string;
  correlationId?: string;
}

/**
 * Publisher for contract lifecycle events via NATS
 * Publishes both generic and specific contract status change events
 */
@Injectable()
export class ContratLifecyclePublisher {
  private readonly logger = new Logger(ContratLifecyclePublisher.name);

  constructor(
    @Optional() private readonly natsService?: NatsService,
  ) {}

  /**
   * Publish a contract status change event
   * Publishes to both generic (crm.contrat.status.changed) and specific (crm.contrat.{status}) subjects
   * 
   * @param payload - The contract status change payload
   */
  async publishStatusChanged(payload: ContratStatusChangedPayload): Promise<void> {
    // Guard: check if NATS service is available and connected
    if (!this.natsService || !this.natsService.isConnected()) {
      this.logger.warn(
        `NATS service not available or disconnected. Skipping event publication for contract ${payload.contratId}`,
      );
      return;
    }

    try {
      // Build the event object
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: payload.correlationId ?? '',
        contrat_id: payload.contratId,
        previous_status: payload.previousStatus,
        new_status: payload.newStatus,
        reason: payload.reason ?? '',
        triggered_by: payload.triggeredBy,
      };

      // Publish to generic subject
      await this.natsService.publish('crm.contrat.status.changed', event);
      this.logger.debug(
        `Published contract status change event to crm.contrat.status.changed for contract ${payload.contratId}`,
      );

      // Publish to specific subject based on new status
      const specificSubject = `crm.contrat.${payload.newStatus.toLowerCase()}`;
      await this.natsService.publish(specificSubject, event);
      this.logger.debug(
        `Published contract status change event to ${specificSubject} for contract ${payload.contratId}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to publish contract status change event for contract ${payload.contratId}: ${error.message}`,
      );
      // Do NOT throw - allow the operation to continue even if event publication fails
    }
  }
}
