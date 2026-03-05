import { describe, expect, it } from 'bun:test';
import type { NatsService } from '@crm/shared-kernel';
import {
  ABONNEMENT_STATUS_ATTENTE,
  ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE,
  PROVISIONING_STATE_EN_ATTENTE_RETRACTATION,
  PROVISIONING_STATE_ERREUR_TECHNIQUE,
  ProvisioningLifecycleEntity,
} from '../../entities';
import type { IProvisioningLifecycleRepository } from '../../repositories/IProvisioningLifecycleRepository';
import {
  type ProvisioningBillingCompensationPort,
  type ProvisioningPaymentsPort,
  ProvisioningSagaService,
  type ProvisioningTransatelPort,
} from '../provisioning-saga.service';

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

describe('ProvisioningSagaService', () => {
  it('starts legal timer at contract signature and sets Attente status', async () => {
    const savedStates: ProvisioningLifecycleEntity[] = [];
    const repository: IProvisioningLifecycleRepository = {
      findByContratId: async () => null,
      findReadyForRetractionDeadline: async () => [],
      save: async (entity) => {
        savedStates.push({ ...entity });
        return entity;
      },
    };

    const paymentsPort: ProvisioningPaymentsPort = {
      setupSepaMandate: async () => ({ mandateId: 'mandate-1' }),
      createRecurringSubscription: async () => ({ subscriptionId: 'sub-1' }),
      pauseOrCancelSubscription: async () => ({ status: 'cancelled' }),
    };

    const transatelPort: ProvisioningTransatelPort = {
      activateLine: async () => ({ activationId: 'activation-1' }),
    };

    const billingCompensationPort: ProvisioningBillingCompensationPort = {
      createCreditNoteIfNeeded: async () => undefined,
    };

    const published: Array<{ subject: string; payload: Record<string, unknown> }> = [];
    const nats = {
      publish: async (subject: string, payload: Record<string, unknown>) => {
        published.push({ subject, payload });
      },
    } as unknown as NatsService;

    const service = new ProvisioningSagaService(
      repository,
      paymentsPort,
      transatelPort,
      billingCompensationPort,
      nats,
    );

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
      published.some(
        (entry) => entry.subject === 'crm.onboarding.client.creation.requested',
      ),
    ).toBeTrue();
  });

  it('runs J+14 sequence in required order: GoCardless then Transatel', async () => {
    const lifecycle = createLifecycle();
    const steps: string[] = [];

    const repository: IProvisioningLifecycleRepository = {
      findByContratId: async () => lifecycle,
      findReadyForRetractionDeadline: async () => [],
      save: async (entity) => entity,
    };

    const paymentsPort: ProvisioningPaymentsPort = {
      setupSepaMandate: async () => ({ mandateId: 'mandate-1' }),
      createRecurringSubscription: async () => {
        steps.push('gocardless-subscription');
        return { subscriptionId: 'sub-1' };
      },
      pauseOrCancelSubscription: async () => ({ status: 'cancelled' }),
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

    const nats = {
      publish: async (subject: string) => {
        if (subject === 'crm.provisioning.sim.expedition.requested') {
          steps.push('sim-expedition');
        }
      },
    } as unknown as NatsService;

    const service = new ProvisioningSagaService(
      repository,
      paymentsPort,
      transatelPort,
      billingCompensationPort,
      nats,
    );

    await service.processRetractionDeadlineElapsed({
      contratId: 'contrat-1',
    });

    expect(steps[0]).toBe('gocardless-subscription');
    expect(steps.includes('transatel-activation')).toBeTrue();
  });

  it('compensates when billing succeeds but Transatel activation fails', async () => {
    const lifecycle = createLifecycle();
    let compensationCalled = false;
    let subscriptionCancelled = false;

    const repository: IProvisioningLifecycleRepository = {
      findByContratId: async () => lifecycle,
      findReadyForRetractionDeadline: async () => [],
      save: async (entity) => {
        lifecycle.provisioningState = entity.provisioningState;
        lifecycle.abonnementStatus = entity.abonnementStatus;
        lifecycle.lastError = entity.lastError;
        lifecycle.metadata = entity.metadata;
        return entity;
      },
    };

    const paymentsPort: ProvisioningPaymentsPort = {
      setupSepaMandate: async () => ({ mandateId: 'mandate-1' }),
      createRecurringSubscription: async () => ({ subscriptionId: 'sub-1' }),
      pauseOrCancelSubscription: async () => {
        subscriptionCancelled = true;
        return { status: 'cancelled' };
      },
    };

    const transatelPort: ProvisioningTransatelPort = {
      activateLine: async () => {
        throw new Error('TRANSATEL_DOWN');
      },
    };

    const billingCompensationPort: ProvisioningBillingCompensationPort = {
      createCreditNoteIfNeeded: async () => {
        compensationCalled = true;
      },
    };

    const published: string[] = [];
    const nats = {
      publish: async (subject: string) => {
        published.push(subject);
      },
    } as unknown as NatsService;

    const service = new ProvisioningSagaService(
      repository,
      paymentsPort,
      transatelPort,
      billingCompensationPort,
      nats,
    );

    await service.processRetractionDeadlineElapsed({ contratId: 'contrat-1' });

    expect(subscriptionCancelled).toBeTrue();
    expect(compensationCalled).toBeTrue();
    expect(lifecycle.provisioningState).toBe(PROVISIONING_STATE_ERREUR_TECHNIQUE);
    expect(lifecycle.abonnementStatus).toBe(
      ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE,
    );
    expect(published.includes('crm.telecom.adv.notification.requested')).toBeTrue();
    expect(published.includes('crm.commercial.subscription.canceled')).toBeTrue();
  });
});
