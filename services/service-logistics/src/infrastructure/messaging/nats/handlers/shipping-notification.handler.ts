import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import { NatsService, EmailSenderService } from '@crm/shared-kernel';

// ============================================================================
// NATS Event Payload
// ============================================================================

interface ShippingStatusChangedPayload {
  expeditionId: string;
  newStatus: string;
  trackingNumber?: string;
  clientId: string;
}

// ============================================================================
// gRPC Client Interfaces
// ============================================================================

interface ClientBaseGrpcResponse {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  organisation_id: string;
}

interface ClientBaseServiceGrpc {
  Get(data: { id: string }): Observable<ClientBaseGrpcResponse>;
}

interface NotificationServiceGrpc {
  NotifyShippingStatusChanged(data: {
    organisation_id: string;
    client_id: string;
    expedition_id: string;
    new_status: string;
    tracking_number?: string;
  }): Observable<unknown>;
}

// ============================================================================
// Email Templates by Status
// ============================================================================

interface EmailTemplate {
  subject: string;
  buildHtml: (trackingNumber?: string) => string;
}

const STATUS_TEMPLATES: Record<string, EmailTemplate> = {
  // French status names (from task spec)
  expedie: {
    subject: 'Votre colis a été expédié',
    buildHtml: (trackingNumber) =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis a été expédié.${trackingNumber ? ` Numéro de suivi : <strong>${trackingNumber}</strong>` : ''}</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  en_transit: {
    subject: 'Votre colis est en cours de livraison',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis est en cours de livraison.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  livre: {
    subject: 'Votre colis a été livré',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis a été livré avec succès.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  // English status variants (used in entity.isDelivered/isInTransit)
  in_transit: {
    subject: 'Votre colis est en cours de livraison',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis est en cours de livraison.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  en_cours: {
    subject: 'Votre colis est en cours de livraison',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis est en cours de livraison.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  delivered: {
    subject: 'Votre colis a été livré',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis a été livré avec succès.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
  livré: {
    subject: 'Votre colis a été livré',
    buildHtml: () =>
      `<p>Bonjour,</p>` +
      `<p>Votre colis a été livré avec succès.</p>` +
      `<p>Cordialement,<br/>L'équipe logistique</p>`,
  },
};

// ============================================================================
// Handler
// ============================================================================

@Injectable()
export class ShippingNotificationHandler implements OnModuleInit {
  private readonly logger = new Logger(ShippingNotificationHandler.name);
  private clientBaseService: ClientBaseServiceGrpc;
  private notificationService: NotificationServiceGrpc;

  constructor(
    private readonly natsService: NatsService,
    private readonly emailSenderService: EmailSenderService,
    @Inject('CORE_PACKAGE') private readonly coreClient: ClientGrpc,
    @Inject('ENGAGEMENT_PACKAGE') private readonly engagementClient: ClientGrpc,
  ) {}

  async onModuleInit(): Promise<void> {
    this.clientBaseService =
      this.coreClient.getService<ClientBaseServiceGrpc>('ClientBaseService');
    this.notificationService =
      this.engagementClient.getService<NotificationServiceGrpc>('NotificationService');

    await this.natsService.subscribe<ShippingStatusChangedPayload>(
      'crm.logistics.expedition.status_changed',
      async (data) => {
        await this.handleShippingStatusChanged(data);
      },
    );

    this.logger.log('Shipping notification handlers registered');
  }

  async handleShippingStatusChanged(data: ShippingStatusChangedPayload): Promise<void> {
    const { expeditionId, newStatus, trackingNumber, clientId } = data;

    try {
      // 1. Find email template for this status
      const normalizedStatus = newStatus.toLowerCase();
      const template = STATUS_TEMPLATES[normalizedStatus];
      if (!template) {
        this.logger.debug(
          `No email template for status "${newStatus}", skipping notification`,
        );
        return;
      }

      // 2. Fetch client email from service-core via gRPC
      let clientData: ClientBaseGrpcResponse;
      try {
        clientData = await lastValueFrom(
          this.clientBaseService.Get({ id: clientId }),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to fetch client ${clientId} from service-core: ${message}`,
        );
        return;
      }

      if (!clientData?.email) {
        this.logger.warn(`skipped: no client email for client ${clientId}`);
        return;
      }

      // 3. Send email via EmailSenderService
      const { subject, buildHtml } = template;
      const htmlBody = buildHtml(trackingNumber);

      try {
        await this.emailSenderService.sendEmail({
          to: clientData.email,
          subject,
          htmlBody,
        });
        this.logger.log(
          `Shipping notification email sent to ${clientData.email} for expedition ${expeditionId} (status: ${newStatus})`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send shipping notification email for expedition ${expeditionId}: ${message}`,
        );
      }

      // 4. Store delivery proof via service-engagement gRPC (channel=EMAIL)
      try {
        await lastValueFrom(
          this.notificationService.NotifyShippingStatusChanged({
            organisation_id: clientData.organisation_id || '',
            client_id: clientId,
            expedition_id: expeditionId,
            new_status: newStatus,
            tracking_number: trackingNumber,
          }),
        );
        this.logger.log(
          `Delivery proof stored for expedition ${expeditionId} (channel=EMAIL)`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to store delivery proof for expedition ${expeditionId}: ${message}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to handle shipping status changed for expedition ${expeditionId}: ${message}`,
        stack,
      );
    }
  }
}
