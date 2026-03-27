import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type ContractSignedEventPayload,
  ProvisioningSagaService,
} from '../../../../domain/provisioning/services';

interface IncomingContractSignedPayload {
  contratId?: string;
  contrat_id?: string;
  clientId?: string;
  client_id?: string;
  commercialId?: string;
  commercial_id?: string;
  organisationId?: string;
  organisation_id?: string;
  dateSignature?: string;
  date_signature?: string;
  montantAbonnement?: number;
  montant_total?: number;
  devise?: string;
  correlationId?: string;
  correlation_id?: string;
}

@Injectable()
export class ContractSignedHandler implements OnModuleInit {
  private readonly logger = new Logger(ContractSignedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<IncomingContractSignedPayload>(
      'contract.signed',
      this.handle.bind(this),
    );

    await this.natsService.subscribe<IncomingContractSignedPayload>(
      'crm.telecom.contrat.signe',
      this.handle.bind(this),
    );
  }

  async handle(payload: IncomingContractSignedPayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    const clientId = payload.clientId || payload.client_id;
    const dateSignature = payload.dateSignature || payload.date_signature;

    if (!contratId || !clientId || !dateSignature) {
      this.logger.warn('Ignoring contract signed event with missing required fields');
      return;
    }

    const event: ContractSignedEventPayload = {
      contratId,
      clientId,
      commercialId: payload.commercialId || payload.commercial_id || null,
      organisationId: payload.organisationId || payload.organisation_id || null,
      dateSignature,
      montantAbonnement:
        Number(payload.montantAbonnement || payload.montant_total || 0) || 0,
      devise: payload.devise || 'EUR',
      correlationId: payload.correlationId || payload.correlation_id,
    };

    await this.sagaService.registerContractSigned(event);
  }
}
