/**
 * E2E Integration Test — Reconduction Tacite Workflow
 *
 * Exercises the full pipeline:
 *   Scheduler → NATS publish → Handler → email + postal → delivery proofs → state update
 *
 * All external dependencies are mocked (no real DB / network).
 */
import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { of } from 'rxjs';
import type { NatsService, EmailSenderService } from '@crm/shared-kernel';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Repository } from 'typeorm';
import type { IReconductionTaciteRepository } from '../../domain/contrats/repositories/IReconductionTaciteRepository';
import type { ContratEntity } from '../../domain/contrats/entities/contrat.entity';
import {
  ReconductionTaciteLogEntity,
  ReconductionTaciteStatus,
} from '../../domain/contrats/entities/reconduction-tacite-log.entity';
import { ReconductionTaciteSchedulerService } from '../scheduling/reconduction-tacite-scheduler.service';
import { ReconductionNotificationHandler } from '../messaging/nats/handlers/reconduction-notification.handler';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeContrat(overrides: Partial<ContratEntity> = {}): ContratEntity {
  return {
    id: 'contrat-1',
    organisationId: 'org-1',
    reference: 'CTR-E2E-001',
    titre: 'Contrat E2E',
    description: null,
    type: null,
    statut: 'ACTIF',
    dateDebut: '2026-01-01',
    dateFin: '2027-01-01',
    dateSignature: '2025-12-15',
    montant: 120.0,
    devise: 'EUR',
    frequenceFacturation: 'MONTHLY',
    documentUrl: null,
    fournisseur: null,
    clientId: 'client-1',
    commercialId: 'commercial-1',
    societeId: null,
    notes: null,
    createdBy: 'system',
    modifiedBy: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    renewalDate: new Date('2027-01-01'),
    taciteRenewalEnabled: true,
    renewalStatus: 'PENDING',
    renewalNotificationJ90SentAt: null,
    renewalNotificationJ30SentAt: null,
    renewalCancellationDeadline: null,
    lignes: [],
    historique: [],
    ...overrides,
  } as ContratEntity;
}

function makeLog(overrides: Partial<ReconductionTaciteLogEntity> = {}): ReconductionTaciteLogEntity {
  const entity = new ReconductionTaciteLogEntity();
  entity.id = 'log-1';
  entity.contratId = 'contrat-1';
  entity.renewalDate = new Date('2027-01-01T00:00:00.000Z');
  entity.notificationJ90Sent = false;
  entity.notificationJ30Sent = false;
  entity.notificationJ90DeliveryProofId = null;
  entity.notificationJ30DeliveryProofId = null;
  entity.status = ReconductionTaciteStatus.PENDING;
  entity.cancelledAt = null;
  entity.cancellationReason = null;
  entity.createdAt = new Date('2026-01-01');
  entity.updatedAt = new Date('2026-01-01');
  entity.contrat = { id: 'contrat-1', clientId: 'client-1', organisationId: 'org-1', reference: 'CTR-E2E-001' } as ContratEntity;
  Object.assign(entity, overrides);
  return entity;
}

// ---------------------------------------------------------------------------
// Mock builders
// ---------------------------------------------------------------------------

function createMocks() {
  const publishedEvents: Array<{ subject: string; payload: unknown }> = [];
  const subscriptions: Record<string, (payload: unknown) => Promise<void>> = {};
  const emailSendCalls: Array<{ to: string; subject: string; htmlBody: string }> = [];
  const notifyJ90Calls: unknown[] = [];
  const notifyJ30Calls: unknown[] = [];
  const generateLabelCalls: unknown[] = [];

  const reconductionRepo: IReconductionTaciteRepository = {
    findByContratId: jest.fn(async () => null),
    findContratsDueForJ90: jest.fn(async () => [makeLog()]),
    findContratsDueForJ30: jest.fn(async () => [makeLog()]),
    markJ90Sent: jest.fn(async () => undefined),
    markJ30Sent: jest.fn(async () => undefined),
    markRenewed: jest.fn(async () => undefined),
    markCancelled: jest.fn(async () => undefined),
    create: jest.fn(async (data) => data as ReconductionTaciteLogEntity),
  };

  const natsService = {
    publish: jest.fn(async (subject: string, payload: unknown) => {
      publishedEvents.push({ subject, payload });
    }),
    subscribe: jest.fn(async (subject: string, handler: (payload: unknown) => Promise<void>) => {
      subscriptions[subject] = handler;
    }),
  } as unknown as NatsService;

  const emailSenderService = {
    sendEmail: jest.fn(async (opts: { to: string; subject: string; htmlBody: string }) => {
      emailSendCalls.push(opts);
      return { messageId: 'msg-e2e', accepted: [opts.to] };
    }),
  } as unknown as EmailSenderService;

  const contratRepository = {
    findOne: jest.fn(async () => makeContrat()),
    update: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<ContratEntity>;

  const clientBaseService = {
    Get: jest.fn(() =>
      of({
        id: 'client-1',
        organisation_id: 'org-1',
        email: 'client@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        adresses: [
          { ligne1: '10 Rue de Paris', code_postal: '75001', ville: 'Paris', pays: 'FR', type: 'POSTAL' },
        ],
      }),
    ),
  };

  const logisticsService = {
    GenerateLabel: jest.fn((data: unknown) => {
      generateLabelCalls.push(data);
      return of({ tracking_number: 'TRACK-E2E', label_url: 'https://label.example.com/e2e' });
    }),
  };

  const notificationService = {
    NotifyReconductionTaciteJ90: jest.fn((data: unknown) => {
      notifyJ90Calls.push(data);
      return of({});
    }),
    NotifyReconductionTaciteJ30: jest.fn((data: unknown) => {
      notifyJ30Calls.push(data);
      return of({});
    }),
  };

  const coreClient = { getService: jest.fn(() => clientBaseService) } as unknown as ClientGrpc;
  const logisticsClient = { getService: jest.fn(() => logisticsService) } as unknown as ClientGrpc;
  const engagementClient = { getService: jest.fn(() => notificationService) } as unknown as ClientGrpc;

  return {
    reconductionRepo,
    natsService,
    emailSenderService,
    contratRepository,
    coreClient,
    logisticsClient,
    engagementClient,
    clientBaseService,
    logisticsService,
    notificationService,
    publishedEvents,
    subscriptions,
    emailSendCalls,
    notifyJ90Calls,
    notifyJ30Calls,
    generateLabelCalls,
  };
}

function createScheduler(mocks: ReturnType<typeof createMocks>) {
  return new ReconductionTaciteSchedulerService(mocks.reconductionRepo, mocks.natsService);
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  return new ReconductionNotificationHandler(
    mocks.natsService,
    mocks.emailSenderService,
    mocks.reconductionRepo,
    mocks.contratRepository,
    mocks.coreClient,
    mocks.logisticsClient,
    mocks.engagementClient,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Reconduction Tacite — E2E Integration', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('Scenario 1: Full J-90 pipeline — scheduler publishes event, handler sends email + postal + updates state', async () => {
    const scheduler = createScheduler(mocks);
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    // Step 1: scheduler detects J-90 due contract and publishes NATS event
    await scheduler.processDueNotifications();

    const j90Events = mocks.publishedEvents.filter((e) => e.subject === 'crm.reconduction.j90.due');
    expect(j90Events.length).toBe(1);
    expect((j90Events[0].payload as any).contratId).toBe('contrat-1');
    expect((j90Events[0].payload as any).clientId).toBe('client-1');

    // Step 2: handler processes the event
    await mocks.subscriptions['crm.reconduction.j90.due'](j90Events[0].payload);

    // Email sent
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.emailSendCalls[0].to).toBe('client@example.com');
    expect(mocks.emailSendCalls[0].subject.toLowerCase()).toContain('reconduction');

    // Postal sent
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);

    // 2 delivery proofs (EMAIL + POSTAL)
    expect(mocks.notifyJ90Calls.length).toBe(2);

    // Contract timestamp updated
    expect(mocks.contratRepository.update).toHaveBeenCalledWith(
      'contrat-1',
      expect.objectContaining({ renewalNotificationJ90SentAt: expect.any(Date) }),
    );

    // Reconduction log marked
    expect(mocks.reconductionRepo.markJ90Sent).toHaveBeenCalledWith('contrat-1');
  });

  it('Scenario 2: Full J-30 pipeline — scheduler publishes event, handler sends email + postal + updates state', async () => {
    const scheduler = createScheduler(mocks);
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    await scheduler.processDueNotifications();

    const j30Events = mocks.publishedEvents.filter((e) => e.subject === 'crm.reconduction.j30.due');
    expect(j30Events.length).toBe(1);

    await mocks.subscriptions['crm.reconduction.j30.due'](j30Events[0].payload);

    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);
    expect(mocks.notifyJ30Calls.length).toBe(2);
    expect(mocks.contratRepository.update).toHaveBeenCalledWith(
      'contrat-1',
      expect.objectContaining({ renewalNotificationJ30SentAt: expect.any(Date) }),
    );
    expect(mocks.reconductionRepo.markJ30Sent).toHaveBeenCalledWith('contrat-1');
  });

  it('Scenario 3: Cancelled contract — no J-30 event published when repository returns empty', async () => {
    // Override: no contracts due for J-30
    (mocks.reconductionRepo.findContratsDueForJ30 as ReturnType<typeof jest.fn>).mockResolvedValue([]);

    const scheduler = createScheduler(mocks);
    await scheduler.processDueNotifications();

    const j30Events = mocks.publishedEvents.filter((e) => e.subject === 'crm.reconduction.j30.due');
    expect(j30Events.length).toBe(0);
  });

  it('Scenario 4: Email failure does not abort postal path', async () => {
    // Force email to throw
    (mocks.emailSenderService.sendEmail as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('SMTP_TIMEOUT'),
    );

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    await mocks.subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Postal still called despite email failure
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);

    // Contract state still updated
    expect(mocks.contratRepository.update).toHaveBeenCalledWith(
      'contrat-1',
      expect.objectContaining({ renewalNotificationJ90SentAt: expect.any(Date) }),
    );
  });

  it('Scenario 5: L.215-1 legal content completeness — all 4 required mentions present', async () => {
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    await mocks.subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    const htmlBody = mocks.emailSendCalls[0].htmlBody;

    expect(htmlBody).toContain('droit de ne pas renouveler');
    // Case-insensitive check — handler uses capital "Date limite de resiliation"
    expect(htmlBody.toLowerCase()).toContain('date limite de resiliation');
    expect(htmlBody.toLowerCase()).toContain('conditions de renouvellement');
    expect(htmlBody.toLowerCase()).toContain('modalites de resiliation');
  });
});
