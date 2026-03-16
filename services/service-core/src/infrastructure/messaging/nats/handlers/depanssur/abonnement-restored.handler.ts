import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { AbonnementService } from '../../../../persistence/typeorm/repositories/depanssur/abonnement.service';

/**
 * NATS handler for abonnement.depanssur.restored.
 *
 * Listens for restoration events published by service-finance after successful payment.
 * Updates the abonnement status from SUSPENDU_IMPAYE back to ACTIF.
 */
@Injectable()
export class AbonnementRestoredHandler implements OnModuleInit {
  private readonly logger = new Logger(AbonnementRestoredHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly abonnementService: AbonnementService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'AbonnementRestoredHandler initialized — subscribing to abonnement.depanssur.restored',
    );
    await this.natsService.subscribe<AbonnementRestoredEvent>(
      'abonnement.depanssur.restored',
      this.handle.bind(this),
    );
  }

  async handle(event: AbonnementRestoredEvent): Promise<void> {
    this.logger.log(
      `Processing abonnement.depanssur.restored: abonnementId=${event.abonnementId} restoredAt=${event.restoredAt}`,
    );

    try {
      const abonnement = await this.abonnementService.findById(event.abonnementId);

      if (!abonnement) {
        this.logger.warn(
          `Abonnement ${event.abonnementId} not found — skipping restoration`,
        );
        return;
      }

      if (abonnement.statut !== 'SUSPENDU_IMPAYE') {
        this.logger.warn(
          `Abonnement ${event.abonnementId} has status "${abonnement.statut}" (expected SUSPENDU_IMPAYE) — skipping`,
        );
        return;
      }

      await this.abonnementService.update({
        id: abonnement.id,
        statut: 'ACTIF',
      });

      this.logger.log(
        `Abonnement ${event.abonnementId} restored to ACTIF (was SUSPENDU_IMPAYE) for client ${event.clientId}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process abonnement.depanssur.restored for abonnementId=${event.abonnementId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}

interface AbonnementRestoredEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  restoredAt: string;
}
