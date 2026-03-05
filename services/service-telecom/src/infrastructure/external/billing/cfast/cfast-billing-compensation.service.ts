import { Injectable } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import type { ProvisioningBillingCompensationPort } from '../../../../domain/provisioning/services';

@Injectable()
export class CfastBillingCompensationService
  implements ProvisioningBillingCompensationPort
{
  constructor(private readonly natsService: NatsService) {}

  async createCreditNoteIfNeeded(input: {
    contratId: string;
    clientId: string;
    organisationId: string;
    amount: number;
    reason: string;
    correlationId?: string;
  }): Promise<void> {
    await this.natsService.publish('crm.billing.cfast.credit_note.requested', {
      contratId: input.contratId,
      clientId: input.clientId,
      organisationId: input.organisationId,
      amount: input.amount,
      currency: 'EUR',
      reason: input.reason,
      adapter: 'CFAST',
      correlationId: input.correlationId || null,
      requestedAt: new Date().toISOString(),
    });
  }
}
