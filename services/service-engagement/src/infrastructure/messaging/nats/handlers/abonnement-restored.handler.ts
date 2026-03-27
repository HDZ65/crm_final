import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { NotificationService } from '../../../persistence/typeorm/repositories/engagement/notification.service';
import { NotificationType } from '../../../../domain/engagement/entities';

interface AbonnementRestoredEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  restoredAt: string;
}

/**
 * NATS handler for abonnement.depanssur.restored in service-engagement.
 *
 * Creates a notification for the client when their abonnement is restored
 * after successful payment (RG3 auto-reactivation).
 */
@Injectable()
export class AbonnementRestoredEngagementHandler implements OnModuleInit {
  private readonly logger = new Logger(AbonnementRestoredEngagementHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'AbonnementRestoredEngagementHandler initialized — subscribing to abonnement.depanssur.restored',
    );
    await this.natsService.subscribe<AbonnementRestoredEvent>(
      'abonnement.depanssur.restored',
      this.handle.bind(this),
    );
  }

  async handle(event: AbonnementRestoredEvent): Promise<void> {
    this.logger.log(
      `Processing abonnement.depanssur.restored: abonnementId=${event.abonnementId} clientId=${event.clientId}`,
    );

    try {
      await this.notificationService.create({
        organisationId: event.organisationId,
        utilisateurId: event.clientId,
        type: NotificationType.INFO,
        titre: 'Abonnement réactivé',
        message: `Votre abonnement a été réactivé suite à la régularisation de votre paiement.`,
        metadata: {
          eventType: 'ABONNEMENT_RESTORED',
          abonnementId: event.abonnementId,
          restoredAt: event.restoredAt,
        },
      });

      this.logger.log(
        `Restoration notification created for client ${event.clientId} (abonnement ${event.abonnementId})`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create restoration notification for abonnementId=${event.abonnementId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}
