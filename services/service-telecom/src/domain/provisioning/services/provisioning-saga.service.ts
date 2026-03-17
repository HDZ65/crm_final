import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
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
  PROVISIONING_STATE_RESILIE,
  PROVISIONING_STATE_SUSPENDU,
  ProvisioningLifecycleEntity,
} from '../entities';
import type { IProvisioningLifecycleRepository } from '../repositories/IProvisioningLifecycleRepository';
import type { ProvisioningTerminationPort } from '../ports';

export const PROVISIONING_LIFECYCLE_REPOSITORY =
  'PROVISIONING_LIFECYCLE_REPOSITORY';
export const PROVISIONING_PAYMENTS_PORT = 'PROVISIONING_PAYMENTS_PORT';
export const PROVISIONING_TRANSATEL_PORT = 'PROVISIONING_TRANSATEL_PORT';
export const PROVISIONING_BILLING_COMPENSATION_PORT =
  'PROVISIONING_BILLING_COMPENSATION_PORT';
export const PROVISIONING_PRODUCTS_PORT = 'PROVISIONING_PRODUCTS_PORT';
export const PROVISIONING_NETWORTH_PORT = 'PROVISIONING_NETWORTH_PORT';
export const PROVISIONING_SUSPENSION_PORT = 'PROVISIONING_SUSPENSION_PORT';
export const PROVISIONING_STELOGY_PORT = 'PROVISIONING_STELOGY_PORT';
export const PROVISIONING_TERMINATION_PORT = 'PROVISIONING_TERMINATION_PORT';

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

export interface ActivationReelleEventPayload {
  contratId: string;
  source: 'SIM_LIVREE' | 'PREMIERE_CONNEXION';
  occurredAt?: string;
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

export interface ProvisioningProductsPort {
  getProductByContratId(contratId: string): Promise<{ requiresWithdrawalPeriod: boolean } | null>;
}

export interface ProvisioningSuspensionPort {
  suspendLine(input: {
    contratId: string;
    clientId: string;
    reason: string;
    correlationId?: string;
  }): Promise<{ suspensionId: string }>;
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
    @Inject(PROVISIONING_PRODUCTS_PORT)
    private readonly productsPort: ProvisioningProductsPort,
    @Inject(PROVISIONING_SUSPENSION_PORT)
    private readonly suspensionPort: ProvisioningSuspensionPort,
    private readonly natsService: NatsService,
    @Inject(PROVISIONING_TERMINATION_PORT)
    private readonly terminationPort: ProvisioningTerminationPort,

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

    // Check if product requires withdrawal period
    const product = await this.productsPort.getProductByContratId(event.contratId);
    if (product && !product.requiresWithdrawalPeriod) {
      // Product is exempt from withdrawal period → skip directly to deadline elapsed
      lifecycle.provisioningState = PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE;
      lifecycle.metadata = {
        ...(lifecycle.metadata || {}),
        exemptFromWithdrawalPeriod: true,
        exemptionAppliedAt: new Date().toISOString(),
      };
    }

    const saved = await this.repository.save(lifecycle);

    await this.publishOnboardingRequests(saved, event.correlationId);
    await this.requestMandate(saved, event.correlationId);

    return saved;
  }

  // ---------------------------------------------------------------------------
  // ÉTAPE 2 — J+14 : Feu vert légal
  //   → Expédition SIM + Provisioning technique Transatel
  //   → PAS de facturation (GoCardless reste en sommeil)
  // ---------------------------------------------------------------------------

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
    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      finRetractationAt: new Date().toISOString(),
    };
    await this.repository.save(lifecycle);

    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    await this.repository.save(lifecycle);

    try {
      // 1. Demander l'expédition de la carte SIM (La Poste)
      await this.natsService.publish('crm.provisioning.sim.expedition.requested', {
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
        carrier: 'LaPoste',
        product: 'SIM',
        correlationId: event.correlationId || null,
      });

      lifecycle.metadata = {
        ...(lifecycle.metadata || {}),
        simExpedieeAt: new Date().toISOString(),
      };
      await this.repository.save(lifecycle);

      // 2. Provisioning technique chez Transatel (ouverture ligne, pas de facturation)
      await this.transatelPort.activateLine({
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        correlationId: event.correlationId,
      });

      lifecycle.lastError = null;
      await this.repository.save(lifecycle);

      this.logger.log(
        `[J+14] Expédition SIM et provisioning Transatel lancés pour ${lifecycle.contratId}. En attente d'activation réelle.`,
      );

      return lifecycle;
    } catch (error: unknown) {
      lifecycle.provisioningState = PROVISIONING_STATE_ERREUR_TECHNIQUE;
      lifecycle.lastError = this.errorMessage(error);
      await this.repository.save(lifecycle);

      await this.natsService.publish('crm.telecom.adv.notification.requested', {
        severity: 'critical',
        topic: 'PROVISIONING_J14',
        contratId: lifecycle.contratId,
        clientId: lifecycle.clientId,
        organisationId: lifecycle.organisationId,
        message: `Échec provisioning J+14: ${this.errorMessage(error)}`,
        correlationId: event.correlationId || null,
      });

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // ÉTAPE 3 — Activation réelle (SIM livrée OU première connexion réseau)
  //   → GoCardless sort du sommeil (facturation démarre)
  //   → Statut → ACTIVE
  // ---------------------------------------------------------------------------

  async processActivationReelle(
    event: ActivationReelleEventPayload,
  ): Promise<ProvisioningLifecycleEntity | null> {
    const lifecycle = await this.repository.findByContratId(event.contratId);
    if (!lifecycle) {
      this.logger.warn(
        `No provisioning lifecycle found for contract ${event.contratId}`,
      );
      return null;
    }

    // Déjà actif → idempotent
    if (lifecycle.provisioningState === PROVISIONING_STATE_ACTIVE) {
      return lifecycle;
    }

    // On ne peut activer que depuis EN_COURS
    if (lifecycle.provisioningState !== PROVISIONING_STATE_EN_COURS) {
      this.logger.warn(
        `Cannot activate: state is ${lifecycle.provisioningState} for ${event.contratId}, expected EN_COURS`,
      );
      return lifecycle;
      return lifecycle;
    }

    // Guard: cannot activate before withdrawal period ends
    const now = new Date();
    if (now < lifecycle.dateFinRetractation) {
      throw new BadRequestException(
        `Cannot activate contract ${event.contratId} before withdrawal period ends on ${lifecycle.dateFinRetractation.toISOString()}`,
      );
    }

    // Continue with activation

    const organisationId = lifecycle.organisationId || '';
    const amountCents = this.toMinorUnits(lifecycle.montantAbonnement);
    const nowIso = new Date().toISOString();

    // Enregistrer l'événement source (livraison ou première connexion)
    const sourceMetadata: Record<string, string> = {};
    if (event.source === 'SIM_LIVREE') {
      sourceMetadata.simLivreeAt = event.occurredAt || nowIso;
    } else {
      sourceMetadata.premiereConnexionAt = event.occurredAt || nowIso;
    }

    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      ...sourceMetadata,
    };
    await this.repository.save(lifecycle);

    let createdSubscriptionId: string | null = null;
    try {
      // Créer l'abonnement GoCardless (facturation démarre maintenant)
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

      lifecycle.abonnementStatus = ABONNEMENT_STATUS_ACTIF;
      lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
      lifecycle.lastError = null;
      lifecycle.metadata = {
        ...(lifecycle.metadata || {}),
        activatedAt: nowIso,
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
        source: event.source,
        occurredAt: nowIso,
      });

      this.logger.log(
        `[ACTIVATION] Ligne activée et facturation démarrée pour ${saved.contratId} (source: ${event.source})`,
      );

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
    try {
      await this.terminationPort.terminateLine(
        lifecycle.contratId,
        lifecycle.clientId,
        'PROVISIONING_CANCELLED',
        new Date().toISOString(),
        '',
      );
    } catch (err: unknown) {
      this.logger.error(
        `Transatel termination failed for ${lifecycle.contratId}: ${(err as Error).message}`,
      );
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

  // ---------------------------------------------------------------------------
  // SUSPENSION — Suspend an active line
  // ---------------------------------------------------------------------------

  public async processSuspension(
    contratId: string,
    reason: string,
    correlationId?: string,
  ): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    if (lifecycle.provisioningState !== PROVISIONING_STATE_ACTIVE) {
      throw new Error(
        `Cannot suspend: state is ${lifecycle.provisioningState} for ${contratId}, expected ACTIVE`,
      );
    }

    this.logger.log(`Suspending line for contract ${contratId}, reason: ${reason}`);

    const result = await this.suspensionPort.suspendLine({
      contratId: lifecycle.contratId,
      clientId: lifecycle.clientId,
      reason,
      correlationId,
    });

    lifecycle.provisioningState = PROVISIONING_STATE_SUSPENDU;
    lifecycle.lastError = null;
    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      suspendedAt: new Date().toISOString(),
      suspensionId: result.suspensionId,
      suspensionReason: reason,
    };

    const saved = await this.repository.save(lifecycle);

    await this.natsService.publish('crm.telecom.ligne.suspendue', {
      contratId: saved.contratId,
      clientId: saved.clientId,
      organisationId: saved.organisationId,
      suspensionId: result.suspensionId,
      reason,
      correlationId: correlationId || null,
    });

    this.logger.log(
      `[SUSPENSION] Line suspended for ${saved.contratId} (suspensionId: ${result.suspensionId})`,
    );

    return saved;
  }

  // ---------------------------------------------------------------------------
  // TERMINATION — Terminate a line (résiliation)
  // ---------------------------------------------------------------------------

  public async processTermination(
    contratId: string,
    reason: string,
  ): Promise<ProvisioningLifecycleEntity> {
    const lifecycle = await this.repository.findByContratId(contratId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for contract ${contratId}`);
    }

    this.logger.log(`Processing termination for ${lifecycle.contratId}, reason: ${reason}`);

    const { terminationId } = await this.terminationPort.terminateLine(
      lifecycle.contratId,
      lifecycle.clientId,
      reason,
      new Date().toISOString(),
      '',
    );

    if (lifecycle.gocardlessSubscriptionId !== null) {
      try {
        await this.paymentsPort.pauseOrCancelSubscription({
          societeId: lifecycle.organisationId || '',
          subscriptionId: lifecycle.gocardlessSubscriptionId,
        });
      } catch (err: unknown) {
        this.logger.error(
          `Cancel GoCardless failed during termination for ${lifecycle.contratId}: ${(err as Error).message}`,
        );
      }
    }

    lifecycle.provisioningState = PROVISIONING_STATE_RESILIE;
    lifecycle.metadata = {
      ...(lifecycle.metadata || {}),
      terminationId,
      terminationReason: reason,
      terminatedAt: new Date().toISOString(),
    };

    await this.natsService.publish('crm.telecom.ligne.resiliee', {
      contratId: lifecycle.contratId,
      terminationId,
      reason,
    });

    return await this.repository.save(lifecycle);
  }
}
