import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailSenderService, NatsService } from '@crm/shared-kernel';
import { lastValueFrom, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { ContratEntity } from '../../../../domain/contrats/entities/contrat.entity';
import type { IReconductionTaciteRepository } from '../../../../domain/contrats/repositories/IReconductionTaciteRepository';

const RECONDUCTION_TACITE_REPOSITORY = 'IReconductionTaciteRepository';

type NotificationKind = 'J90' | 'J30';

interface ReconductionDuePayload {
  contratId?: string;
  contrat_id?: string;
  renewalDate?: string;
  renewal_date?: string;
  clientId?: string;
  client_id?: string;
}

interface ClientAddressGrpcResponse {
  ligne1?: string;
  ligne2?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  type?: string;
}

interface ClientBaseGrpcResponse {
  id: string;
  organisation_id?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  adresses?: ClientAddressGrpcResponse[];
}

interface ClientBaseServiceGrpc {
  Get(data: { id: string }): Observable<ClientBaseGrpcResponse>;
}

interface LogisticsAddressGrpc {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

interface LogisticsServiceGrpc {
  GenerateLabel(data: {
    organisation_id: string;
    service_level: string;
    format: string;
    weight_gr: number;
    sender: LogisticsAddressGrpc;
    recipient: LogisticsAddressGrpc;
    contract_id?: string;
  }): Observable<{ tracking_number?: string; label_url?: string }>;
}

interface ReconductionNotificationGrpcRequest {
  organisation_id: string;
  client_id: string;
  contrat_id: string;
  renewal_date: string;
  cancellation_deadline: string;
  contrat_reference: string;
  duree?: string;
  montant?: string;
}

interface NotificationServiceGrpc {
  NotifyReconductionTaciteJ90(data: ReconductionNotificationGrpcRequest): Observable<unknown>;
  NotifyReconductionTaciteJ30(data: ReconductionNotificationGrpcRequest): Observable<unknown>;
}

interface LegalNotificationContent {
  subject: string;
  htmlBody: string;
  textBody: string;
  cancellationDeadlineIso: string;
}

@Injectable()
export class ReconductionNotificationHandler implements OnModuleInit {
  private readonly logger = new Logger(ReconductionNotificationHandler.name);
  private clientBaseService: ClientBaseServiceGrpc;
  private logisticsService: LogisticsServiceGrpc;
  private notificationService: NotificationServiceGrpc;

  constructor(
    private readonly natsService: NatsService,
    private readonly emailSenderService: EmailSenderService,
    @Inject(RECONDUCTION_TACITE_REPOSITORY)
    private readonly reconductionTaciteRepository: IReconductionTaciteRepository,
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @Inject('CORE_PACKAGE') private readonly coreClient: ClientGrpc,
    @Inject('LOGISTICS_PACKAGE') private readonly logisticsClient: ClientGrpc,
    @Inject('ENGAGEMENT_PACKAGE') private readonly engagementClient: ClientGrpc,
  ) {}

  async onModuleInit(): Promise<void> {
    this.clientBaseService = this.coreClient.getService<ClientBaseServiceGrpc>('ClientBaseService');
    this.logisticsService = this.logisticsClient.getService<LogisticsServiceGrpc>('LogisticsService');
    this.notificationService = this.engagementClient.getService<NotificationServiceGrpc>('NotificationService');

    await this.natsService.subscribe<ReconductionDuePayload>('crm.reconduction.j90.due', async (payload) => {
      await this.handleReconductionDue('J90', payload);
    });

    await this.natsService.subscribe<ReconductionDuePayload>('crm.reconduction.j30.due', async (payload) => {
      await this.handleReconductionDue('J30', payload);
    });

    this.logger.log('Reconduction notification handlers registered for J90/J30 due events');
  }

  private async handleReconductionDue(kind: NotificationKind, payload: ReconductionDuePayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    const clientId = payload.clientId || payload.client_id;
    const renewalDateIso = payload.renewalDate || payload.renewal_date;

    if (!contratId || !clientId || !renewalDateIso) {
      this.logger.warn(
        `[${kind}] Invalid reconduction payload, required fields missing (contratId/clientId/renewalDate)`,
      );
      return;
    }

    const renewalDate = new Date(renewalDateIso);
    if (Number.isNaN(renewalDate.getTime())) {
      this.logger.warn(`[${kind}] Invalid renewalDate for contrat ${contratId}: ${renewalDateIso}`);
      return;
    }

    const contrat = await this.contratRepository.findOne({ where: { id: contratId } });
    if (!contrat) {
      this.logger.warn(`[${kind}] Contrat ${contratId} not found`);
      return;
    }

    let clientData: ClientBaseGrpcResponse;
    try {
      clientData = await lastValueFrom(this.clientBaseService.Get({ id: clientId }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${kind}] Failed to fetch client ${clientId}: ${message}`);
      return;
    }

    const legalContent = this.buildLegalNotificationContent(kind, contrat, renewalDate);
    const recipientEmail = (clientData.email || '').trim();

    if (!recipientEmail) {
      this.logger.warn(`[${kind}] Missing client email for client ${clientId}`);
    } else {
      try {
        const emailResult = await this.emailSenderService.sendEmail({
          to: recipientEmail,
          subject: legalContent.subject,
          htmlBody: legalContent.htmlBody,
          textBody: legalContent.textBody,
        });

        this.logger.log(
          `[${kind}] Email sent for contrat ${contratId} (messageId=${emailResult.messageId}, accepted=${emailResult.accepted})`,
        );

        await this.storeDeliveryProof(kind, 'EMAIL', {
          contrat,
          clientId,
          organisationId: clientData.organisation_id || contrat.organisationId,
          renewalDateIso: renewalDate.toISOString(),
          cancellationDeadlineIso: legalContent.cancellationDeadlineIso,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[${kind}] Email notification failed for contrat ${contratId}; continuing postal path: ${message}`,
        );
      }
    }

    const postalAddress = this.pickPostalAddress(clientData.adresses);
    if (!postalAddress) {
      this.logger.warn(`[${kind}] Missing postal address for client ${clientId}`);
    } else {
      try {
        const postalResult = await lastValueFrom(
          this.logisticsService.GenerateLabel({
            organisation_id: clientData.organisation_id || contrat.organisationId,
            service_level: 'COURRIER_RECONDUCTION_TACITE',
            format: 'A4',
            weight_gr: 20,
            contract_id: contrat.id,
            sender: {
              line1: 'CRM Service Commercial',
              postal_code: '75001',
              city: 'Paris',
              country: 'FR',
            },
            recipient: postalAddress,
          }),
        );

        this.logger.log(
          `[${kind}] Postal notification sent via Maileva for contrat ${contratId} (tracking=${postalResult?.tracking_number || 'n/a'})`,
        );

        await this.storeDeliveryProof(kind, 'POSTAL', {
          contrat,
          clientId,
          organisationId: clientData.organisation_id || contrat.organisationId,
          renewalDateIso: renewalDate.toISOString(),
          cancellationDeadlineIso: legalContent.cancellationDeadlineIso,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[${kind}] Postal notification failed for contrat ${contratId}: ${message}`);
      }
    }

    await this.updateContractAndReconductionStatus(kind, contratId);
  }

  private buildLegalNotificationContent(
    kind: NotificationKind,
    contrat: ContratEntity,
    renewalDate: Date,
  ): LegalNotificationContent {
    const cancellationDeadline = new Date(renewalDate);
    if (kind === 'J90') {
      cancellationDeadline.setDate(cancellationDeadline.getDate() - 30);
    }

    const renewalDateLabel = this.formatDateFr(renewalDate);
    const cancellationDeadlineLabel = this.formatDateFr(cancellationDeadline);
    const durationLabel = contrat.dateDebut && contrat.dateFin ? `${contrat.dateDebut} -> ${contrat.dateFin}` : 'Selon votre contrat en vigueur';
    const amountLabel = contrat.montant != null ? `${Number(contrat.montant).toFixed(2)} ${contrat.devise || 'EUR'}` : 'Voir conditions tarifaires contractuelles';

    const subject =
      kind === 'J90'
        ? `Information reconduction tacite J-90 - Contrat ${contrat.reference}`
        : `Rappel reconduction tacite J-30 - Contrat ${contrat.reference}`;

    const commonText =
      `Conformement a l'article L.215-1 du Code de la consommation, vous disposez du droit de ne pas renouveler le contrat.\n\n` +
      `Date de reconduction: ${renewalDateLabel}\n` +
      `Date limite de resiliation: ${cancellationDeadlineLabel}\n\n` +
      `Conditions de renouvellement:\n` +
      `- Duree: ${durationLabel}\n` +
      `- Prix: ${amountLabel}\n\n` +
      `Modalites de resiliation:\n` +
      `- Adresse: CRM Service Commercial, 10 rue de la Reconduction, 75001 Paris, France\n` +
      `- Contact: support-contrats@crm.local / +33 1 00 00 00 00\n` +
      `- Merci d'indiquer la reference contrat ${contrat.reference}.\n`;

    const htmlBody =
      `<p>Bonjour,</p>` +
      `<p>Conformement a l'article L.215-1 du Code de la consommation, vous disposez du <strong>droit de ne pas renouveler le contrat</strong>.</p>` +
      `<p><strong>Date de reconduction</strong>: ${renewalDateLabel}<br/>` +
      `<strong>Date limite de resiliation</strong>: ${cancellationDeadlineLabel}</p>` +
      `<p><strong>Conditions de renouvellement</strong>:<br/>` +
      `Duree: ${durationLabel}<br/>` +
      `Prix: ${amountLabel}</p>` +
      `<p><strong>Modalites de resiliation</strong>:<br/>` +
      `Adresse: CRM Service Commercial, 10 rue de la Reconduction, 75001 Paris, France<br/>` +
      `Contact: support-contrats@crm.local / +33 1 00 00 00 00<br/>` +
      `Reference contrat: ${contrat.reference}</p>` +
      `<p>Cordialement,<br/>CRM Service Commercial</p>`;

    return {
      subject,
      htmlBody,
      textBody: commonText,
      cancellationDeadlineIso: cancellationDeadline.toISOString(),
    };
  }

  private pickPostalAddress(addresses: ClientAddressGrpcResponse[] | undefined): LogisticsAddressGrpc | null {
    if (!addresses || addresses.length === 0) {
      return null;
    }

    const preferred =
      addresses.find((address) => (address.type || '').toUpperCase() === 'POSTAL') || addresses[0];

    const line1 = (preferred.ligne1 || '').trim();
    const postalCode = (preferred.code_postal || '').trim();
    const city = (preferred.ville || '').trim();
    if (!line1 || !postalCode || !city) {
      return null;
    }

    return {
      line1,
      line2: preferred.ligne2 || undefined,
      postal_code: postalCode,
      city,
      country: (preferred.pays || 'FR').trim() || 'FR',
    };
  }

  private async storeDeliveryProof(
    kind: NotificationKind,
    channel: 'EMAIL' | 'POSTAL',
    payload: {
      contrat: ContratEntity;
      clientId: string;
      organisationId: string;
      renewalDateIso: string;
      cancellationDeadlineIso: string;
    },
  ): Promise<void> {
    const request: ReconductionNotificationGrpcRequest = {
      organisation_id: payload.organisationId,
      client_id: payload.clientId,
      contrat_id: payload.contrat.id,
      renewal_date: payload.renewalDateIso,
      cancellation_deadline: payload.cancellationDeadlineIso,
      contrat_reference: `${payload.contrat.reference} [${channel}]`,
      duree:
        payload.contrat.dateDebut && payload.contrat.dateFin
          ? `${payload.contrat.dateDebut} -> ${payload.contrat.dateFin}`
          : undefined,
      montant:
        payload.contrat.montant != null
          ? `${Number(payload.contrat.montant).toFixed(2)} ${payload.contrat.devise || 'EUR'}`
          : undefined,
    };

    try {
      if (kind === 'J90') {
        await lastValueFrom(this.notificationService.NotifyReconductionTaciteJ90(request));
      } else {
        await lastValueFrom(this.notificationService.NotifyReconductionTaciteJ30(request));
      }

      this.logger.log(
        `[${kind}] Delivery proof stored via engagement gRPC (channel=${channel}, contrat=${payload.contrat.id})`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${kind}] Failed to store delivery proof (channel=${channel}, contrat=${payload.contrat.id}): ${message}`,
      );
    }
  }

  private async updateContractAndReconductionStatus(
    kind: NotificationKind,
    contratId: string,
  ): Promise<void> {
    const now = new Date();

    try {
      if (kind === 'J90') {
        await this.contratRepository.update(contratId, {
          renewalNotificationJ90SentAt: now,
        });
        await this.reconductionTaciteRepository.markJ90Sent(contratId);
      } else {
        await this.contratRepository.update(contratId, {
          renewalNotificationJ30SentAt: now,
        });
        await this.reconductionTaciteRepository.markJ30Sent(contratId);
      }

      this.logger.log(`[${kind}] Contrat and reconduction status updated for ${contratId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${kind}] Failed to update contrat/reconduction status for ${contratId}: ${message}`);
    }
  }

  private formatDateFr(value: Date): string {
    return value.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
