import { describe, expect, it } from 'bun:test';
import { BadRequestException } from '@nestjs/common';
import type { NatsService } from '@crm/shared-kernel';
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
} from '../../entities';
import type { IProvisioningLifecycleRepository } from '../../repositories/IProvisioningLifecycleRepository';
import {
  type ProvisioningBillingCompensationPort,
  type ProvisioningPaymentsPort,
  ProvisioningSagaService,
  type ProvisioningSuspensionPort,
  type ProvisioningTransatelPort,
} from '../provisioning-saga.service';
import type { ProvisioningTerminationPort } from '../../ports';

function createLifecycle(): ProvisioningLifecycleEntity {
  const entity = new ProvisioningLifecycleEntity();
  entity.id = 'lifecycle-1';
  entity.organisationId = '11111111-1111-1111-1111-111111111111';
  entity.contratId = 'contrat-1';
  entity.clientId = 'client-1';
  entity.commercialId = 'commercial-1';
  entity.dateSignature = new Date('2026-03-01T09:00:00.000Z');
  entity.dateFinRetractation = new Date('2026-03-15T09:00:00.000Z');
  entity.abonnementStatus = ABONNEMENT_STATUS_ATTENTE;
  entity.provisioningState = PROVISIONING_STATE_EN_ATTENTE_RETRACTATION;
  entity.montantAbonnement = 29.9;
  entity.devise = 'EUR';
  entity.sepaMandateId = null;
  entity.gocardlessSubscriptionId = null;
  entity.compensationDone = false;
  entity.lastError = null;
  entity.metadata = null;
  entity.createdAt = new Date('2026-03-01T09:00:00.000Z');
  entity.updatedAt = new Date('2026-03-01T09:00:00.000Z');
  return entity;
}

function createMocks() {
  const published: Array<{ subject: string; payload: Record<string, unknown> }> = [];
  const steps: string[] = [];

  const repository: IProvisioningLifecycleRepository = {
    findByContratId: async () => null,
    findReadyForRetractionDeadline: async () => [],
    save: async (entity) => entity,
  };

  const paymentsPort: ProvisioningPaymentsPort = {
    setupSepaMandate: async () => ({ mandateId: 'mandate-1' }),
    createRecurringSubscription: async () => {
      steps.push('gocardless-subscription');
      return { subscriptionId: 'sub-1' };
    },
    pauseOrCancelSubscription: async () => {
      steps.push('gocardless-cancel');
      return { status: 'cancelled' };
    },
  };

  const transatelPort: ProvisioningTransatelPort = {
    activateLine: async () => {
      steps.push('transatel-activation');
      return { activationId: 'activation-1' };
    },
  };

  const billingCompensationPort: ProvisioningBillingCompensationPort = {
    createCreditNoteIfNeeded: async () => undefined,
  };

  const productsPort = {
    getProductByContratId: async () => ({ requiresWithdrawalPeriod: true }),
  };

  const suspensionPort: ProvisioningSuspensionPort = {
    suspendLine: async (input) => {
      steps.push('transatel-suspension');
      return { suspensionId: `transatel-suspend-${input.contratId}` };
    },
  };

  const terminationPort: ProvisioningTerminationPort = {
    terminateLine: async (contratId) => {
      steps.push('transatel-termination');
      return { terminationId: `transatel-terminate-${contratId}` };
    },
  };

  const nats = {
    publish: async (subject: string, payload: Record<string, unknown>) => {
      published.push({ subject, payload });
      if (subject === 'crm.provisioning.sim.expedition.requested') {
        steps.push('sim-expedition');
      }
    },
  } as unknown as NatsService;

  return { repository, paymentsPort, transatelPort, billingCompensationPort, productsPort, suspensionPort, terminationPort, nats, published, steps };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ProvisioningSagaService(
    mocks.repository,
    mocks.paymentsPort,
    mocks.transatelPort,
    mocks.billingCompensationPort,
    mocks.productsPort,
    mocks.suspensionPort,
    mocks.nats,
    mocks.terminationPort,
  );
}

describe('ProvisioningSagaService', () => {
  it('starts legal timer at contract signature and sets Attente status', async () => {
    const savedStates: ProvisioningLifecycleEntity[] = [];
    const mocks = createMocks();
    mocks.repository.save = async (entity) => {
      savedStates.push({ ...entity });
      return entity;
    };

    const service = createService(mocks);

    await service.registerContractSigned({
      contratId: 'contrat-1',
      clientId: 'client-1',
      commercialId: 'commercial-1',
      organisationId: '11111111-1111-1111-1111-111111111111',
      dateSignature: '2026-03-01T09:00:00.000Z',
      montantAbonnement: 29.9,
      devise: 'EUR',
    });

    expect(savedStates[0].abonnementStatus).toBe(ABONNEMENT_STATUS_ATTENTE);
    expect(savedStates[0].dateFinRetractation.toISOString()).toBe(
      '2026-03-15T09:00:00.000Z',
    );
    expect(
      mocks.published.some(
        (entry) => entry.subject === 'crm.onboarding.client.creation.requested',
      ),
    ).toBeTrue();
  });

  it('J+14: sends SIM expedition and Transatel activation but NO GoCardless', async () => {
    const lifecycle = createLifecycle();
    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    await service.processRetractionDeadlineElapsed({
      contratId: 'contrat-1',
    });

    // SIM expedition and Transatel should be called
    expect(mocks.steps.includes('sim-expedition')).toBeTrue();
    expect(mocks.steps.includes('transatel-activation')).toBeTrue();

    // GoCardless should NOT be called at J+14
    expect(mocks.steps.includes('gocardless-subscription')).toBeFalse();

    // State should be EN_COURS (waiting for activation), NOT ACTIVE
    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_EN_COURS);

    // Metadata should have finRetractationAt and simExpedieeAt
    expect(lifecycle.metadata).toBeDefined();
    expect((lifecycle.metadata as Record<string, unknown>).finRetractationAt).toBeDefined();
    expect((lifecycle.metadata as Record<string, unknown>).simExpedieeAt).toBeDefined();

    // No activation events should be published
    expect(
      mocks.published.some((e) => e.subject === 'crm.telecom.ligne.activee'),
    ).toBeFalse();
    expect(
      mocks.published.some((e) => e.subject === 'crm.commercial.subscription.activated'),
    ).toBeFalse();
  });

  it('activation réelle: creates GoCardless subscription and sets ACTIVE', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    lifecycle.dateFinRetractation = new Date('2026-02-15T09:00:00.000Z');
    lifecycle.metadata = { finRetractationAt: '2026-03-15T09:00:00.000Z', simExpedieeAt: '2026-03-15T10:00:00.000Z' };

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    await service.processActivationReelle({
      contratId: 'contrat-1',
      source: 'SIM_LIVREE',
      occurredAt: '2026-03-18T14:00:00.000Z',
    });

    // GoCardless subscription should be created NOW
    expect(mocks.steps.includes('gocardless-subscription')).toBeTrue();

    // State should be ACTIVE
    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_ACTIVE);
    expect(lifecycle.abonnementStatus).toBe(ABONNEMENT_STATUS_ACTIF);

    // Metadata should have simLivreeAt and activatedAt
    const meta = lifecycle.metadata as Record<string, unknown>;
    expect(meta.simLivreeAt).toBe('2026-03-18T14:00:00.000Z');
    expect(meta.activatedAt).toBeDefined();

    // Activation events should be published
    expect(
      mocks.published.some((e) => e.subject === 'crm.telecom.ligne.activee'),
    ).toBeTrue();
    expect(
      mocks.published.some((e) => e.subject === 'crm.commercial.subscription.activated'),
    ).toBeTrue();

    // Source should be in the published event
    const activationEvent = mocks.published.find(
      (e) => e.subject === 'crm.telecom.ligne.activee',
    );
    expect(activationEvent?.payload.source).toBe('SIM_LIVREE');
  });

  it('activation réelle: première connexion réseau also triggers activation', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    lifecycle.dateFinRetractation = new Date('2026-02-15T09:00:00.000Z');
    lifecycle.metadata = { finRetractationAt: '2026-03-15T09:00:00.000Z' };

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    await service.processActivationReelle({
      contratId: 'contrat-1',
      source: 'PREMIERE_CONNEXION',
    });

    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_ACTIVE);
    const meta = lifecycle.metadata as Record<string, unknown>;
    expect(meta.premiereConnexionAt).toBeDefined();
  });

  it('activation réelle: is idempotent when already ACTIVE', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    const result = await service.processActivationReelle({
      contratId: 'contrat-1',
      source: 'SIM_LIVREE',
    });

    // Should return without doing anything
    expect(result?.provisioningState).toBe(PROVISIONING_STATE_ACTIVE);
    expect(mocks.steps).toHaveLength(0);
  });

  it('J+14: sets ERREUR_TECHNIQUE when Transatel fails (no compensation needed)', async () => {
    const lifecycle = createLifecycle();
    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;
    mocks.transatelPort.activateLine = async () => {
      throw new Error('TRANSATEL_DOWN');
    };

    const service = createService(mocks);

    let threw = false;
    try {
      await service.processRetractionDeadlineElapsed({ contratId: 'contrat-1' });
    } catch {
      threw = true;
    }

    expect(threw).toBeTrue();
    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_ERREUR_TECHNIQUE);

    // GoCardless should NOT have been called (no billing to compensate)
    expect(mocks.steps.includes('gocardless-subscription')).toBeFalse();

    // ADV notification should be sent
    expect(
      mocks.published.some((e) => e.subject === 'crm.telecom.adv.notification.requested'),
    ).toBeTrue();
  });

  it('activation réelle: compensates when GoCardless subscription succeeds but save fails', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    lifecycle.dateFinRetractation = new Date('2026-02-15T09:00:00.000Z');
    lifecycle.metadata = {};
    let compensationCalled = false;
    let saveCount = 0;

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;
    mocks.repository.save = async (entity) => {
      saveCount++;
      // Fail on the save after GoCardless subscription is set
      if (saveCount === 2) {
        throw new Error('DB_ERROR');
      }
      Object.assign(lifecycle, entity);
      return entity;
    };
    mocks.billingCompensationPort.createCreditNoteIfNeeded = async () => {
      compensationCalled = true;
    };

    const service = createService(mocks);

    await service.processActivationReelle({
      contratId: 'contrat-1',
      source: 'SIM_LIVREE',
    });

    // Compensation should have been triggered
    expect(compensationCalled).toBeTrue();
    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_ERREUR_TECHNIQUE);
    expect(lifecycle.abonnementStatus).toBe(
      ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE,
    );
  });

  it('should skip J+14 for exempt products', async () => {
    const mocks = createMocks();
    mocks.repository.findByContratId = async () => null;
    mocks.productsPort.getProductByContratId = async () => ({
      requiresWithdrawalPeriod: false,
    });

    const service = createService(mocks);

    const result = await service.registerContractSigned({
      contratId: 'contrat-exempt',
      clientId: 'client-1',
      commercialId: 'commercial-1',
      organisationId: '11111111-1111-1111-1111-111111111111',
      dateSignature: '2026-03-01T09:00:00.000Z',
      montantAbonnement: 29.9,
      devise: 'EUR',
    });

    expect(result.provisioningState).toBe(PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE);
    expect((result.metadata as Record<string, unknown>).exemptFromWithdrawalPeriod).toBeTrue();
  });

  it('should reject activation before withdrawal period ends', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;
    lifecycle.dateFinRetractation = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    let threwBadRequest = false;
    try {
      await service.processActivationReelle({
        contratId: 'contrat-1',
        source: 'SIM_LIVREE',
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        threwBadRequest = true;
      }
    }

    expect(threwBadRequest).toBeTrue();
  });

  it('processSuspension: suspends an ACTIVE line and publishes event', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
    lifecycle.metadata = { activatedAt: '2026-03-18T14:00:00.000Z' };

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    const result = await service.processSuspension('contrat-1', 'Impayé');

    // State should be SUSPENDU
    expect(result.provisioningState).toBe(PROVISIONING_STATE_SUSPENDU);

    // Suspension port should have been called
    expect(mocks.steps.includes('transatel-suspension')).toBeTrue();

    // Metadata should have suspension info
    const meta = result.metadata as Record<string, unknown>;
    expect(meta.suspendedAt).toBeDefined();
    expect(meta.suspensionId).toBe('transatel-suspend-contrat-1');
    expect(meta.suspensionReason).toBe('Impayé');

    // NATS event crm.telecom.ligne.suspendue should be published
    const suspensionEvent = mocks.published.find(
      (e) => e.subject === 'crm.telecom.ligne.suspendue',
    );
    expect(suspensionEvent).toBeDefined();
    expect(suspensionEvent?.payload.contratId).toBe('contrat-1');
    expect(suspensionEvent?.payload.suspensionId).toBe('transatel-suspend-contrat-1');
    expect(suspensionEvent?.payload.reason).toBe('Impayé');
  });

  it('processSuspension: rejects suspension when state is not ACTIVE', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_EN_COURS;

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    let threw = false;
    try {
      await service.processSuspension('contrat-1', 'Impayé');
    } catch (error) {
      threw = true;
      expect((error as Error).message).toContain('Cannot suspend');
    }

    expect(threw).toBeTrue();
    expect(mocks.steps).toHaveLength(0);
  });

  it('processSuspension: throws when lifecycle not found', async () => {
    const mocks = createMocks();

    const service = createService(mocks);

    let threw = false;
    try {
      await service.processSuspension('unknown-contrat', 'Impayé');
    } catch (error) {
      threw = true;
      expect((error as Error).message).toContain('Lifecycle not found');
    }

    expect(threw).toBeTrue();
  });

  it('processTermination: terminates line, cancels GoCardless, and publishes event', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
    lifecycle.gocardlessSubscriptionId = 'sub-1';
    lifecycle.metadata = { activatedAt: '2026-03-18T14:00:00.000Z' };

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    const result = await service.processTermination('contrat-1', 'CLIENT_REQUEST');

    // State should be RESILIE
    expect(result.provisioningState).toBe(PROVISIONING_STATE_RESILIE);

    // Transatel termination should have been called
    expect(mocks.steps.includes('transatel-termination')).toBeTrue();

    // GoCardless cancel should have been called
    expect(mocks.steps.includes('gocardless-cancel')).toBeTrue();

    // Metadata should have termination info
    const meta = result.metadata as Record<string, unknown>;
    expect(meta.terminatedAt).toBeDefined();
    expect(meta.terminationId).toBe('transatel-terminate-contrat-1');
    expect(meta.terminationReason).toBe('CLIENT_REQUEST');

    // NATS event crm.telecom.ligne.resiliee should be published
    const terminationEvent = mocks.published.find(
      (e) => e.subject === 'crm.telecom.ligne.resiliee',
    );
    expect(terminationEvent).toBeDefined();
    expect(terminationEvent?.payload.contratId).toBe('contrat-1');
    expect(terminationEvent?.payload.terminationId).toBe('transatel-terminate-contrat-1');
    expect(terminationEvent?.payload.reason).toBe('CLIENT_REQUEST');
  });

  it('processTermination: skips GoCardless cancel when no subscription', async () => {
    const lifecycle = createLifecycle();
    lifecycle.provisioningState = PROVISIONING_STATE_ACTIVE;
    lifecycle.gocardlessSubscriptionId = null;

    const mocks = createMocks();
    mocks.repository.findByContratId = async () => lifecycle;

    const service = createService(mocks);

    const result = await service.processTermination('contrat-1', 'ADMIN_DECISION');

    expect(result.provisioningState).toBe(PROVISIONING_STATE_RESILIE);
    expect(mocks.steps.includes('transatel-termination')).toBeTrue();
    expect(mocks.steps.includes('gocardless-cancel')).toBeFalse();
  });

  it('processTermination: throws when lifecycle not found', async () => {
    const mocks = createMocks();

    const service = createService(mocks);

    let threw = false;
    try {
      await service.processTermination('unknown-contrat', 'CLIENT_REQUEST');
    } catch (error) {
      threw = true;
      expect((error as Error).message).toContain('Lifecycle not found');
    }

    expect(threw).toBeTrue();
  });
});
