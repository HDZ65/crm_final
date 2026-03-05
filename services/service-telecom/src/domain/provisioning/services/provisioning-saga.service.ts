import { Inject, Injectable, Logger } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  ABONNEMENT_STATUS_ACTIF,
  ABONNEMENT_STATUS_ATTENTE,
  ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE,
  PROVISIONING_STATE_ACTIVE,
  PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE,
  PROVISIONING_STATE_EN_ATTENTE_RETRACTATION,
  PROVISIONING_STATE_EN_COURS,
  PROVISIONING_STATE_ERREUR_TECHNIQUE,
  ProvisioningLifecycleEntity,
} from '../entities';
import type { IProvisioningLifecycleRepository } from '../repositories/IProvisioningLifecycleRepository';

export const PROVISIONING_LIFECYCLE_REPOSITORY =
  'PROVISIONING_LIFECYCLE_REPOSITORY';
export const PROVISIONING_PAYMENTS_PORT = 'PROVISIONING_PAYMENTS_PORT';
export const PROVISIONING_TRANSATEL_PORT = 'PROVISIONING_TRANSATEL_PORT';
export const PROVISIONING_BILLING_COMPENSATION_PORT =
  'PROVISIONING_BILLING_COMPENSATION_PORT';

export interface ContractSignedEventPayload {
  contratId: string;
  organisationId?: string | null;
  clientId: string;
  commercialId?: string | null;
  dateSignature: string;
  montantAbonnement?: number;
  devise?: string;
  correlationId?: string;
}

export interface RetractionDeadlineElapsedEventPayload {
  contratId: string;
  triggeredAt?: string;
  correlationId?: string;
}

export interface InvoicePaidEventPayload {
  contratId: string;
  clientId: string;
  commercialId?: string | null;
  montant: number;
  devise?: string;
  paidAt?: string;
  correlationId?: string;
}

export interface GoCardlessPaymentSucceededEventPayload {
  factureId?: string;
  amount?: number;
  currency?: string;
  goCardlessPaymentId?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface ProvisioningPaymentsPort {
  setupSepaMandate(input: {
    societeId: string;
    clientId: string;
    description: string;
    correlationId?: string;
  }): Promise<{ mandateId: string }>;

  createRecurringSubscription(input: {
    societeId: string;
    clientId: string;
    amountCents: number;
    currency: string;
    metadata: Record<string, string>;
  }): Promise<{ subscriptionId: string }>;

  pauseOrCancelSubscription(input: {
    societeId: string;
    subscriptionId: string;
  }): Promise<{ status: string }>;
}

export interface ProvisioningTransatelPort {
  activateLine(input: {
    contratId: string;
    clientId: string;
    correlationId?: string;
  }): Promise<{ activationId: string }>;
}

export interface ProvisioningBillingCompensationPort {
  createCreditNoteIfNeeded(input: {
    contratId: string;
    clientId: string;
    organisationId: string;
    amount: number;
    reason: string;
    correlationId?: string;
  }): Promise<void>;
}

@Injectable()
export class ProvisioningSagaService {
  private readonly logger = new Logger(ProvisioningSagaService.name);

  constructor(
    @Inject(PROVISIONING_LIFECYCLE_REPOSITORY)
    private readonly repository: IProvisioningLifecycleRepository,
    @Inject(PROVISIONING_PAYMENTS_PORT)
    private readonly paymentsPort: ProvisioningPaymentsPort,
    @Inject(PROVISIONING_TRANSATEL_PORT)
    private readonly transatelPort: ProvisioningTransatelPort,
    @Inject(PROVISIONING_BILLING_COMPENSATION_PORT)
    private readonly billingCompensationPort: ProvisioningBillingCompensationPort,
    private readonly natsService: NatsService,
  ) {}

  async registerContractSigned(
    event: ContractSignedEventPayload,
  ): Promise<ProvisioningLifecycleEntity> {
    const signatureDate = new Date(event.dateSignature);
    if (Number.isNaN(signatureDate.getTime())) {
      throw new Error(`Invalid dateSignature for contract ${event.contratId}`);
    }

    const existing = await this.repository.findByContratId(event.contratId);
    const lifecycle = existing ?? new ProvisioningLifecycleEntity();

    lifecycle.contratId = event.contratId;
    lifecycle.organisationId = event.organisationId || null;
    lifecycle.clientId = event.clientId;
    lifecycle.commercialId = event.commercialId || null;
    lifecycle.dateSignature = signatureDate;
    lifecycle.dateFinRetractation = this.addDays(signatureDate, 14);
    lifecycle.abonnementStatus = ABONNEMENT_STATUS_ATTENTE;
    lifecycle.provisioningState = PROVISIONING_STATE_EN_ATTENTE_RETRACTATION;
    lifecycle.montantAbonnement = Number(event.montantAbonnement || 0);
    lifecycle.devise = event.devise || 'EUR';
    lifecycle.compensationDone = false;
    lifecycle.lastError = null;
    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      contratSigneAt: new Date().toISOString(),
      correlationId: event.correlationId || null,
    };

    const saved = await this.repository.save(lifecycle);

    await this.publishOnboardingRequests(saved, event.correlationId);
    await this.requestMandate(saved, event.correlationId);

    return saved;
  }

  async processRetractionDeadlineElapsed(
    event: RetractionDeadlineElapsedEventPayload,
  ): Promise<ProvisioningLifecycleEntity | null> {
    const lifecycle = await this.repository.findByContratId(event.contratId);
    if (!lifecycle) {
      this.logger.warn(
        `No provisioning lifecycle found for contract ${event.contratId}`,
      );
      return null;
    }

    if (
      lifecycle.provisioningState === PROVISIONING_STATE_ACTIVE ||
      lifecycle.provisioningState === PROVISIONING_STATE_ERREUR_TECHNIQUE
    ) {
      return lifecycle;
    }

    lifecycle.provisioningState = PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE;
    await this.repository.save(lifecycle);

    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    await this.repository.save(lifecycle);

    const organisationId = lifecycle.organisationId || '';
    const amountCents = this.toMinorUnits(lifecycle.montantAbonnement);

    let createdSubscriptionId: string | null = null;
    try {
      const subscription = await this.paymentsPort.createRecurringSubscription({
        societeId: organisationId,
        clientId: lifecycle.clientId,
        amountCents,
        currency: lifecycle.devise || 'EUR',
        metadata: {
          contrat_id: lifecycle.contratId,
          client_id: lifecycle.clientId,
        },
      });
      createdSubscriptionId = subscription.subscriptionId;
      lifecycle.gocardlessSubscriptionId = createdSubscriptionId;
      await this.repository.save(lifecycle);

      await this.natsService.publish('crm.provisioning.sim.expedition.requested', {
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
        carrier: 'LaPoste',
        product: 'SIM',
        correlationId: event.correlationId || null,
      });

      await this.transatelPort.activateLine({
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        correlationId: event.correlationId,
      });

      lifecycle.abonnementStatus = ABONNEMENT_STATUS_ACTIF;
      lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
      lifecycle.lastError = null;
      lifecycle.metadata = {
        ...(lifecycle.metadata || {}),
        activatedAt: new Date().toISOString(),
      };

      const saved = await this.repository.save(lifecycle);

      await this.natsService.publish('crm.commercial.subscription.activated', {
        subscriptionId: saved.contratId,
        organisationId: saved.organisationId,
        clientId: saved.clientId,
        productId: 'SIM_TELECOM',
      });

      await this.natsService.publish('crm.telecom.ligne.activee', {
        contratId: saved.contratId,
        clientId: saved.clientId,
        organisationId: saved.organisationId,
        status: saved.abonnementStatus,
        occurredAt: new Date().toISOString(),
      });

      return saved;
    } catch (error: unknown) {
      if (createdSubscriptionId && organisationId) {
        await this.compensateProvisioningFailure(
          lifecycle,
          createdSubscriptionId,
          this.errorMessage(error),
          event.correlationId,
        );
        return lifecycle;
      }

      lifecycle.provisioningState = PROVISIONING_STATE_ERREUR_TECHNIQUE;
      lifecycle.lastError = this.errorMessage(error);
      await this.repository.save(lifecycle);
      throw error;
    }
  }

  async registerFirstInvoicePaid(event: InvoicePaidEventPayload): Promise<void> {
    const fixedPrime = Number(process.env.TELECOM_PRIME_FIXE_EUR || '30');

    await this.natsService.publish('crm.commissions.prime_fixe.requested', {
      contratId: event.contratId,
      clientId: event.clientId,
      commercialId: event.commercialId || null,
      montantPrime: fixedPrime,
      devise: event.devise || 'EUR',
      sourceEvent: 'PremiereFacturePayee',
      paidAt: event.paidAt || new Date().toISOString(),
      correlationId: event.correlationId || null,
    });
  }

  async registerMonthlyInvoicePaid(event: InvoicePaidEventPayload): Promise<void> {
    const recurrentRate = Number(
      process.env.TELECOM_COMMISSION_RECURRENTE_PERCENT || '5',
    );
    const commissionAmount =
      Math.round((event.montant * recurrentRate + Number.EPSILON)) / 100;

    await this.natsService.publish('crm.commissions.recurrente.requested', {
      contratId: event.contratId,
      clientId: event.clientId,
      commercialId: event.commercialId || null,
      tauxPercent: recurrentRate,
      montantBase: event.montant,
      montantCommission: commissionAmount,
      devise: event.devise || 'EUR',
      sourceEvent: 'FactureMensuellePayee',
      paidAt: event.paidAt || new Date().toISOString(),
      correlationId: event.correlationId || null,
    });
  }

  async registerGoCardlessPaymentSucceeded(
    event: GoCardlessPaymentSucceededEventPayload,
  ): Promise<void> {
    const metadata = event.metadata || {};
    const contratId = this.readString(metadata, [
      'contratId',
      'contrat_id',
      'contract_id',
    ]);

    if (!contratId) {
      return;
    }

    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      return;
    }

    const currentCount = Number(
      this.readNumber(lifecycle.metadata || {}, ['successfulPaymentsCount']) || 0,
    );
    const nextCount = currentCount + 1;

    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      successfulPaymentsCount: nextCount,
      lastGoCardlessPaymentId: event.goCardlessPaymentId || null,
      lastPaymentAt: new Date().toISOString(),
    };
    await this.repository.save(lifecycle);

    const payload: InvoicePaidEventPayload = {
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      commercialId: lifecycle.commercialId,
      montant: Number(event.amount || 0),
      devise: event.currency || lifecycle.devise || 'EUR',
      paidAt: new Date().toISOString(),
      correlationId: event.correlationId,
    };

    if (nextCount === 1) {
      await this.registerFirstInvoicePaid(payload);
      return;
    }

    await this.registerMonthlyInvoicePaid(payload);
  }

  private async publishOnboardingRequests(
    lifecycle: ProvisioningLifecycleEntity,
    correlationId?: string,
  ): Promise<void> {
    await this.natsService.publish('crm.onboarding.client.creation.requested', {
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId: lifecycle.organisationId,
      correlationId: correlationId || null,
    });

    await this.natsService.publish(
      'crm.onboarding.abonnement.creation.requested',
      {
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
        abonnementStatus: ABONNEMENT_STATUS_ATTENTE,
        correlationId: correlationId || null,
      },
    );
  }

  private async requestMandate(
    lifecycle: ProvisioningLifecycleEntity,
    correlationId?: string,
  ): Promise<void> {
    if (!lifecycle.organisationId) {
      return;
    }

    try {
      const mandate = await this.paymentsPort.setupSepaMandate({
        societeId: lifecycle.organisationId,
        clientId: lifecycle.clientId,
        description: `Mandat SEPA contrat ${lifecycle.contratId}`,
        correlationId,
      });

      lifecycle.sepaMandateId = mandate.mandateId;
      await this.repository.save(lifecycle);
    } catch (error: unknown) {
      await this.natsService.publish('crm.telecom.adv.notification.requested', {
        severity: 'warning',
        topic: 'MANDAT_SEPA',
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        message: `Echec demande mandat SEPA: ${this.errorMessage(error)}`,
        correlationId: correlationId || null,
      });
    }
  }

  private async compensateProvisioningFailure(
    lifecycle: ProvisioningLifecycleEntity,
    subscriptionId: string,
    reason: string,
    correlationId?: string,
  ): Promise<void> {
    const organisationId = lifecycle.organisationId || '';

    await this.paymentsPort.pauseOrCancelSubscription({
      societeId: organisationId,
      subscriptionId,
    });

    await this.billingCompensationPort.createCreditNoteIfNeeded({
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId,
      amount: lifecycle.montantAbonnement,
      reason,
      correlationId,
    });

    lifecycle.provisioningState = PROVISIONING_STATE_ERREUR_TECHNIQUE;
    lifecycle.abonnementStatus =
      ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE;
    lifecycle.compensationDone = true;
    lifecycle.lastError = reason;
    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      compensationAt: new Date().toISOString(),
      compensationReason: reason,
    };
    await this.repository.save(lifecycle);

    await this.natsService.publish('crm.commercial.subscription.canceled', {
      subscriptionId: lifecycle.contratId,
    });

    await this.natsService.publish('crm.telecom.adv.notification.requested', {
      severity: 'critical',
      topic: 'ACTIVATION_TRANSATEL',
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId,
      message:
        'Compensation saga executee: abonnement GoCardless annule et statut abonnement en erreur technique',
      abonnementStatus: lifecycle.abonnementStatus,
      reason,
      correlationId: correlationId || null,
    });
  }

  private addDays(baseDate: Date, days: number): Date {
    const cloned = new Date(baseDate.getTime());
    cloned.setUTCDate(cloned.getUTCDate() + days);
    return cloned;
  }

  private toMinorUnits(amount: number): number {
    return Math.round((Number(amount || 0) + Number.EPSILON) * 100);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private readString(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  public async retryTransatelActivation(
    contratId: string,
  ): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    if (lifecycle.provisioningState !== PROVISIONING_STATE_ERREUR_TECHNIQUE) {
      throw new Error(
        `Cannot retry Transatel: state is ${lifecycle.provisioningState}, expected ERREUR_TECHNIQUE`,
      );
    }

    this.logger.log(`Retrying Transatel activation for ${lifecycle.contratId}`);

    try {
      await this.transatelPort.activateLine({
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
      });

      lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
      lifecycle.abonnementStatus = ABONNEMENT_STATUS_ACTIF;
      lifecycle.lastError = null;

      await this.natsService.publish('crm.commercial.subscription.activated', {
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
      });

      await this.natsService.publish('crm.telecom.ligne.activee', {
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
      });

      return await this.repository.save(lifecycle);
    } catch (err: unknown) {
      this.logger.error(
        `Retry Transatel activation failed for ${lifecycle.contratId}: ${(err as Error).message}`,
      );
      lifecycle.lastError = (err as Error).message;
      await this.repository.save(lifecycle);
      throw err;
    }
  }

  public async retrySepaMandate(
    contratId: string,
  ): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    if (lifecycle.sepaMandateId !== null) {
      throw new Error(
        `Cannot retry SEPA mandate: mandate already exists ${lifecycle.sepaMandateId}`,
      );
    }

    this.logger.log(`Retrying SEPA mandate for ${lifecycle.contratId}`);

    try {
      const result = await this.paymentsPort.setupSepaMandate({
        societeId: lifecycle.organisationId || '',
        clientId: lifecycle.clientId,
        description: `Mandat SEPA - Contrat ${lifecycle.contratId}`,
      });

      lifecycle.sepaMandateId = result.mandateId;
      return await this.repository.save(lifecycle);
    } catch (err: unknown) {
      this.logger.error(
        `Retry SEPA mandate failed for ${lifecycle.contratId}: ${(err as Error).message}`,
      );
      lifecycle.lastError = (err as Error).message;
      await this.repository.save(lifecycle);
      throw err;
    }
  }

  public async forceActive(contratId: string): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    if (
      lifecycle.provisioningState !== PROVISIONING_STATE_EN_COURS &&
      lifecycle.provisioningState !== PROVISIONING_STATE_ERREUR_TECHNIQUE
    ) {
      throw new Error(`Cannot force active: state is ${lifecycle.provisioningState}`);
    }

    this.logger.log(`Forcing active state for ${lifecycle.contratId}`);

    lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
    lifecycle.abonnementStatus = ABONNEMENT_STATUS_ACTIF;
    lifecycle.lastError = null;

    await this.natsService.publish('crm.commercial.subscription.activated', {
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId: lifecycle.organisationId,
    });

    await this.natsService.publish('crm.telecom.ligne.activee', {
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId: lifecycle.organisationId,
    });

    return await this.repository.save(lifecycle);
  }

  public async triggerRetractionDeadline(
    contratId: string,
  ): Promise<ProvisioningLifecycleEntity | null> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    if (
      lifecycle.provisioningState !== PROVISIONING_STATE_EN_ATTENTE_RETRACTATION
    ) {
      throw new Error(
        `Cannot trigger retraction: state is ${lifecycle.provisioningState}, expected EN_ATTENTE_RETRACTATION`,
      );
    }

    this.logger.log(`Triggering retraction deadline for ${lifecycle.contratId}`);
    return await this.processRetractionDeadlineElapsed({ contratId });
  }

  public async cancelProvisioning(
    contratId: string,
  ): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    this.logger.log(`Cancel provisioning for ${lifecycle.contratId}`);

    if (lifecycle.gocardlessSubscriptionId !== null) {
      try {
        await this.paymentsPort.pauseOrCancelSubscription({
          societeId: lifecycle.organisationId || '',
          subscriptionId: lifecycle.gocardlessSubscriptionId,
        });
      } catch (err: unknown) {
        this.logger.error(
          `Cancel subscription failed for ${lifecycle.contratId}: ${(err as Error).message}`,
        );
      }
    }

    lifecycle.provisioningState = PROVISIONING_STATE_ERREUR_TECHNIQUE;
    lifecycle.abonnementStatus = ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE;

    await this.natsService.publish('crm.commercial.subscription.canceled', {
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      organisationId: lifecycle.organisationId,
    });

    return await this.repository.save(lifecycle);
  }
}
