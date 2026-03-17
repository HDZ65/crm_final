import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { NatsService } from '@crm/shared-kernel';
import { EcheanceEncaisseeHandler } from '../echeance-encaissee.handler';
import type {
  RecurrenceGenerationService,
  RecurrenceResult,
} from '../../../../../domain/commercial/services/recurrence-generation.service';

// --- Mock builders -------------------------------------------------------

function createMocks() {
  const subscriptions: Record<string, (payload: unknown) => Promise<void>> = {};

  const natsService = {
    publish: jest.fn(async () => undefined),
    subscribe: jest.fn(async (subject: string, handler: (payload: unknown) => Promise<void>) => {
      subscriptions[subject] = handler;
    }),
  } as unknown as NatsService;

  const recurrenceResult: RecurrenceResult = {
    creee: true,
    raison: null,
    recurrence: {
      contratId: 'contrat-1',
      echeanceId: 'ech-1',
      dateEncaissement: new Date('2026-03-15'),
      periode: '2026-03',
      numeroMois: 1,
      baremeId: 'bareme-1',
      baremeVersion: 1,
      montantBase: 100,
      tauxRecurrence: 5,
      montantCalcule: 5,
      statutRecurrence: 'ACTIVE' as never,
    },
  };

  const recurrenceGenerationService = {
    genererRecurrence: jest.fn(async () => recurrenceResult),
    suspendreRecurrences: jest.fn(async () => undefined),
    verifierEligibilite: jest.fn(() => true),
  } as unknown as RecurrenceGenerationService;

  return { natsService, recurrenceGenerationService, subscriptions, recurrenceResult };
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  return new EcheanceEncaisseeHandler(mocks.natsService, mocks.recurrenceGenerationService);
}

async function initAndGetSubscriptions(mocks: ReturnType<typeof createMocks>) {
  const handler = createHandler(mocks);
  await handler.onModuleInit();
  return { handler, subscriptions: mocks.subscriptions };
}

// --- Tests ---------------------------------------------------------------

describe('EcheanceEncaisseeHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('subscribes to payment.echeance.encaissee on init', async () => {
    await initAndGetSubscriptions(mocks);

    expect(mocks.natsService.subscribe).toHaveBeenCalledTimes(1);
    const subscribeArgs = (mocks.natsService.subscribe as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(subscribeArgs[0]).toBe('payment.echeance.encaissee');
  });

  it('calls genererRecurrence with correct params', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-1',
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).toHaveBeenCalledTimes(1);
    const args = (mocks.recurrenceGenerationService.genererRecurrence as ReturnType<typeof jest.fn>)
      .mock.calls[0];
    expect(args[0]).toBe('contrat-1');
    expect(args[1]).toBe('ech-1');
    expect(args[2]).toBe('2026-03-15T00:00:00.000Z');
  });

  it('handles successful recurrence generation (creee=true)', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    // Should not throw
    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-1',
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).toHaveBeenCalledTimes(1);
  });

  it('handles when recurrence is not generated (creee=false)', async () => {
    (
      mocks.recurrenceGenerationService.genererRecurrence as ReturnType<typeof jest.fn>
    ).mockResolvedValue({
      creee: false,
      raison: 'ECHEANCE_NON_REGLEE',
      recurrence: null,
    });

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    // Should not throw — just logs the reason
    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-1',
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).toHaveBeenCalledTimes(1);
  });

  it('skips when contrat_id is missing', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-1',
      contrat_id: '',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).not.toHaveBeenCalled();
  });

  it('skips when echeance_id is missing', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['payment.echeance.encaissee']({
      echeance_id: '',
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).not.toHaveBeenCalled();
  });

  it('does not throw on service error (error path)', async () => {
    (
      mocks.recurrenceGenerationService.genererRecurrence as ReturnType<typeof jest.fn>
    ).mockRejectedValue(new Error('SERVICE_FAILURE'));

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    // Should not throw — handler catches errors internally
    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-1',
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      montant: 150.0,
      date_encaissement: '2026-03-15T00:00:00.000Z',
    });

    expect(mocks.recurrenceGenerationService.genererRecurrence).toHaveBeenCalledTimes(1);
  });

  it('passes date_encaissement string directly to service', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);
    const dateStr = '2026-06-30T23:59:59.999Z';

    await subscriptions['payment.echeance.encaissee']({
      echeance_id: 'ech-2',
      contrat_id: 'contrat-2',
      organisation_id: 'org-1',
      montant: 200.0,
      date_encaissement: dateStr,
    });

    const args = (mocks.recurrenceGenerationService.genererRecurrence as ReturnType<typeof jest.fn>)
      .mock.calls[0];
    expect(args[0]).toBe('contrat-2');
    expect(args[1]).toBe('ech-2');
    expect(args[2]).toBe(dateStr);
  });
});
