import { Injectable, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type InvoicePaidEventPayload,
  ProvisioningSagaService,
} from '../../../../domain/provisioning/services';

interface IncomingInvoicePayload {
  contratId?: string;
  contrat_id?: string;
  clientId?: string;
  client_id?: string;
  commercialId?: string;
  commercial_id?: string;
  montant?: number;
  amount?: number;
  devise?: string;
  paidAt?: string;
  paid_at?: string;
  correlationId?: string;
  correlation_id?: string;
}

@Injectable()
export class FirstInvoicePaidHandler implements OnModuleInit {
  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<IncomingInvoicePayload>(
      'crm.telecom.premiere_facture_payee',
      this.handle.bind(this),
    );
  }

  async handle(payload: IncomingInvoicePayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    const clientId = payload.clientId || payload.client_id;

    if (!contratId || !clientId) {
      return;
    }

    const event: InvoicePaidEventPayload = {
      contratId,
      clientId,
      commercialId: payload.commercialId || payload.commercial_id || null,
      montant: Number(payload.montant || payload.amount || 0),
      devise: payload.devise || 'EUR',
      paidAt: payload.paidAt || payload.paid_at,
      correlationId: payload.correlationId || payload.correlation_id,
    };

    await this.sagaService.registerFirstInvoicePaid(event);
  }
}
