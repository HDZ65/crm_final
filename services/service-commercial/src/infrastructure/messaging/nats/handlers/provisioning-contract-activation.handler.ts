import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainException, NatsService } from '@crm/shared-kernel';
import { ContratLifecycleService } from '../../../../domain/contrats/services/contrat-lifecycle.service';

/**
 * Handler for provisioning contract activation via NATS
 * Subscribes to crm.commercial.subscription.activated (published by service-telecom after J+14 retraction period)
 * Activates the contract via ContratLifecycleService
 */
@Injectable()
export class ProvisioningContractActivationHandler implements OnModuleInit {
  private readonly logger = new Logger(ProvisioningContractActivationHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly lifecycleService: ContratLifecycleService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('ProvisioningContractActivationHandler initialized - subscribing to provisioning events');

    await this.natsService.subscribe(
      'crm.commercial.subscription.activated',
      this.handleSubscriptionActivated.bind(this),
    );
  }

  private async handleSubscriptionActivated(data: any): Promise<void> {
    this.logger.log('Received crm.commercial.subscription.activated event');

    const contratId = data.contratId || data.contrat_id;
    if (!contratId) {
      this.logger.warn('Received subscription.activated event without contratId, ignoring');
      return;
    }

    try {
      await this.lifecycleService.activate(contratId, {
        reason: 'PROVISIONING_COMPLETED_J14',
        triggeredBy: 'SYSTEM',
      });

      this.logger.log(`Contract ${contratId} activated after J+14 provisioning`);
    } catch (error: any) {
      if (error instanceof DomainException) {
        if (error.code === 'CONTRAT_INVALID_STATUS_TRANSITION') {
          this.logger.warn(
            `Contract ${contratId} already active or in terminal state, ignoring`,
          );
          return;
        }

        if (error.code === 'CONTRAT_NOT_FOUND') {
          this.logger.warn(`Contract ${contratId} not found, ignoring`);
          return;
        }
      }

      this.logger.error(
        `Failed to activate contract ${contratId} after provisioning: ${error.message}`,
        error.stack,
      );
    }
  }
}
