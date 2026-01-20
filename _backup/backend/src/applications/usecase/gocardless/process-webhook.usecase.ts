import { Injectable, Inject, Logger } from '@nestjs/common';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';
import { GoCardlessService } from '../../../infrastructure/services/gocardless.service';
import { CreateGoCardlessMandateUseCase } from './create-gocardless-mandate.usecase';

export interface GoCardlessWebhookEvent {
  id: string;
  created_at: string;
  resource_type: string;
  action: string;
  links: Record<string, string>;
  details?: {
    origin: string;
    cause: string;
    description: string;
  };
  metadata?: Record<string, string>;
}

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  constructor(
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
    private readonly gocardlessService: GoCardlessService,
    private readonly createMandateUseCase: CreateGoCardlessMandateUseCase,
  ) {}

  async execute(events: GoCardlessWebhookEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.log(
        `Processing webhook event: ${event.id} - ${event.resource_type}:${event.action}`,
      );

      try {
        switch (event.resource_type) {
          case 'billing_requests':
            await this.handleBillingRequestEvent(event);
            break;
          case 'mandates':
            await this.handleMandateEvent(event);
            break;
          case 'payments':
            await this.handlePaymentEvent(event);
            break;
          case 'subscriptions':
            await this.handleSubscriptionEvent(event);
            break;
          default:
            this.logger.warn(`Unhandled resource type: ${event.resource_type}`);
        }
      } catch (error) {
        this.logger.error(
          `Error processing event ${event.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private async handleBillingRequestEvent(event: GoCardlessWebhookEvent): Promise<void> {
    switch (event.action) {
      case 'fulfilled':
        // Billing request completed - mandate was created
        const billingRequest = await this.gocardlessService.getBillingRequest(
          event.links.billing_request,
        );

        if (billingRequest.links?.mandate_request_mandate) {
          const mandate = await this.gocardlessService.getMandate(
            billingRequest.links.mandate_request_mandate,
          );

          // Extract client_id from metadata (set during setup)
          const clientId = billingRequest.metadata?.client_id || event.metadata?.client_id;

          if (clientId) {
            // Check if mandate already exists
            const existing = await this.repository.findByMandateId(mandate.id);
            if (!existing) {
              await this.createMandateUseCase.execute({
                clientId,
                gocardlessCustomerId: billingRequest.links.customer || '',
                gocardlessBankAccountId: billingRequest.links.customer_bank_account,
                mandateId: mandate.id,
                mandateReference: mandate.reference,
                mandateStatus: mandate.status,
                scheme: mandate.scheme,
              });
              this.logger.log(`Created mandate record for ${mandate.id}`);
            }
          } else {
            this.logger.warn(
              `No client_id in metadata for billing request ${event.links.billing_request}`,
            );
          }
        }
        break;

      case 'cancelled':
      case 'failed':
        this.logger.log(
          `Billing request ${event.action}: ${event.links.billing_request}`,
        );
        break;
    }
  }

  private async handleMandateEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const mandateId = event.links.mandate;
    const mandateRecord = await this.repository.findByMandateId(mandateId);

    if (!mandateRecord) {
      this.logger.warn(`Mandate ${mandateId} not found in database`);
      return;
    }

    switch (event.action) {
      case 'active':
        await this.repository.update(mandateRecord.id, {
          mandateStatus: 'active',
        });
        this.logger.log(`Mandate ${mandateId} is now active`);
        break;

      case 'cancelled':
      case 'failed':
      case 'expired':
        await this.repository.update(mandateRecord.id, {
          mandateStatus: event.action as any,
          subscriptionStatus: mandateRecord.subscriptionId ? 'cancelled' : undefined,
        });
        this.logger.log(`Mandate ${mandateId} status changed to ${event.action}`);
        break;

      case 'replaced':
        const newMandateId = event.links.new_mandate;
        if (newMandateId) {
          await this.repository.update(mandateRecord.id, {
            mandateId: newMandateId,
            mandateStatus: 'active',
          });
          this.logger.log(`Mandate ${mandateId} replaced by ${newMandateId}`);
        }
        break;
    }
  }

  private async handlePaymentEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const paymentId = event.links.payment;

    switch (event.action) {
      case 'confirmed':
        this.logger.log(`Payment ${paymentId} confirmed`);
        // Here you could update invoice status, send notification, etc.
        break;

      case 'failed':
        this.logger.warn(
          `Payment ${paymentId} failed: ${event.details?.description}`,
        );
        // Here you could update invoice status, create retry, notify user
        break;

      case 'paid_out':
        this.logger.log(`Payment ${paymentId} paid out to your account`);
        break;

      case 'cancelled':
        this.logger.log(`Payment ${paymentId} cancelled`);
        break;

      case 'charged_back':
        this.logger.warn(`Payment ${paymentId} charged back`);
        break;
    }
  }

  private async handleSubscriptionEvent(event: GoCardlessWebhookEvent): Promise<void> {
    const subscriptionId = event.links.subscription;
    const mandateRecord = await this.repository.findBySubscriptionId(subscriptionId);

    if (!mandateRecord) {
      this.logger.warn(`Subscription ${subscriptionId} not found in database`);
      return;
    }

    switch (event.action) {
      case 'created':
      case 'active':
        await this.repository.update(mandateRecord.id, {
          subscriptionStatus: 'active',
        });
        break;

      case 'cancelled':
      case 'finished':
        await this.repository.update(mandateRecord.id, {
          subscriptionStatus: event.action,
          nextChargeDate: undefined,
        });
        this.logger.log(`Subscription ${subscriptionId} ${event.action}`);
        break;

      case 'paused':
        await this.repository.update(mandateRecord.id, {
          subscriptionStatus: 'paused',
        });
        break;

      case 'resumed':
        await this.repository.update(mandateRecord.id, {
          subscriptionStatus: 'active',
        });
        break;

      case 'payment_created':
        // A payment was created for this subscription
        this.logger.log(
          `Payment created for subscription ${subscriptionId}: ${event.links.payment}`,
        );
        break;
    }
  }
}
