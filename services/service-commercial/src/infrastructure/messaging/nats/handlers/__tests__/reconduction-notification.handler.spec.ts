import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { of } from 'rxjs';
import type { NatsService, EmailSenderService } from '@crm/shared-kernel';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Repository } from 'typeorm';
import type { IReconductionTaciteRepository } from '../../../../../domain/contrats/repositories/IReconductionTaciteRepository';
import type { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';
import { ReconductionNotificationHandler } from '../reconduction-notification.handler';

// --- Factories -----------------------------------------------------------

function makeContrat(overrides: Partial<ContratEntity> = {}): ContratEntity {
  return {
    id: 'contrat-1',
    organisationId: 'org-1',
    reference: 'CTR-2026-001',
    titre: 'Contrat test',
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

// --- Mock builders -------------------------------------------------------

function createMocks() {
  const subscriptions: Record<string, (payload: unknown) => Promise<void>> = {};

  const natsService = {
    publish: jest.fn(async () => undefined),
    subscribe: jest.fn(async (subject: string, handler: (payload: unknown) => Promise<void>) => {
      subscriptions[subject] = handler;
    }),
  } as unknown as NatsService;

  const emailSendCalls: Array<{ to: string; subject: string; htmlBody: string; textBody: string }> = [];
  const emailSenderService = {
    sendEmail: jest.fn(async (opts: { to: string; subject: string; htmlBody: string; textBody: string }) => {
      emailSendCalls.push(opts);
      return { messageId: 'msg-1', accepted: [opts.to] };
    }),
  } as unknown as EmailSenderService;

  const reconductionTaciteRepository: IReconductionTaciteRepository = {
    findByContratId: jest.fn(async () => null),
    findContratsDueForJ90: jest.fn(async () => []),
    findContratsDueForJ30: jest.fn(async () => []),
    markJ90Sent: jest.fn(async () => undefined),
    markJ30Sent: jest.fn(async () => undefined),
    markRenewed: jest.fn(async () => undefined),
    markCancelled: jest.fn(async () => undefined),
    create: jest.fn(async (data) => data as any),
  };

  const contratRepository = {
    findOne: jest.fn(async () => makeContrat()),
    update: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<ContratEntity>;

  const notifyJ90Calls: unknown[] = [];
  const notifyJ30Calls: unknown[] = [];
  const generateLabelCalls: unknown[] = [];

  const clientBaseService = {
    Get: jest.fn((_data: { id: string }) =>
      of({
        id: 'client-1',
        organisation_id: 'org-1',
        email: 'client@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        adresses: [
          {
            ligne1: '10 Rue de Paris',
            code_postal: '75001',
            ville: 'Paris',
            pays: 'FR',
            type: 'POSTAL',
          },
        ],
      }),
    ),
  };

  const logisticsService = {
    GenerateLabel: jest.fn((data: unknown) => {
      generateLabelCalls.push(data);
      return of({ tracking_number: 'TRACK-001', label_url: 'https://label.example.com/1' });
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

  const coreClient = {
    getService: jest.fn(() => clientBaseService),
  } as unknown as ClientGrpc;

  const logisticsClient = {
    getService: jest.fn(() => logisticsService),
  } as unknown as ClientGrpc;

  const engagementClient = {
    getService: jest.fn(() => notificationService),
  } as unknown as ClientGrpc;

  return {
    natsService,
    emailSenderService,
    reconductionTaciteRepository,
    contratRepository,
    coreClient,
    logisticsClient,
    engagementClient,
    // Direct access to inner mocks for assertions
    clientBaseService,
    logisticsService,
    notificationService,
    subscriptions,
    emailSendCalls,
    notifyJ90Calls,
    notifyJ30Calls,
    generateLabelCalls,
  };
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  return new ReconductionNotificationHandler(
    mocks.natsService,
    mocks.emailSenderService,
    mocks.reconductionTaciteRepository,
    mocks.contratRepository,
    mocks.coreClient,
    mocks.logisticsClient,
    mocks.engagementClient,
  );
}

async function initAndGetSubscriptions(mocks: ReturnType<typeof createMocks>) {
  const handler = createHandler(mocks);
  await handler.onModuleInit();
  return { handler, subscriptions: mocks.subscriptions };
}

// --- Tests ---------------------------------------------------------------

describe('ReconductionNotificationHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('J-90 happy path: sends email + postal, stores 2 delivery proofs, updates status', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Email was sent
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.emailSendCalls[0].to).toBe('client@example.com');

    // Postal label was generated
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);

    // 2 delivery proofs stored via engagement gRPC (one EMAIL, one POSTAL)
    expect(mocks.notificationService.NotifyReconductionTaciteJ90).toHaveBeenCalledTimes(2);

    // Contrat timestamp updated
    expect(mocks.contratRepository.update).toHaveBeenCalledTimes(1);
    const updateCall = (mocks.contratRepository.update as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(updateCall[0]).toBe('contrat-1');
    expect(updateCall[1]).toHaveProperty('renewalNotificationJ90SentAt');

    // Reconduction repository markJ90Sent called
    expect(mocks.reconductionTaciteRepository.markJ90Sent).toHaveBeenCalledTimes(1);
  });

  it('J-30 happy path: sends email + postal, stores proofs, status NOTIFIED_J30', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j30.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Email + postal sent
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);

    // 2 delivery proofs for J30
    expect(mocks.notificationService.NotifyReconductionTaciteJ30).toHaveBeenCalledTimes(2);

    // Contrat updated with J30 sent timestamp
    const updateCall = (mocks.contratRepository.update as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(updateCall[1]).toHaveProperty('renewalNotificationJ30SentAt');

    // markJ30Sent called
    expect(mocks.reconductionTaciteRepository.markJ30Sent).toHaveBeenCalledTimes(1);
  });

  it('email failure still sends postal, logs error, no crash', async () => {
    (mocks.emailSenderService.sendEmail as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('SMTP_TIMEOUT'),
    );

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    // Should not throw
    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Email was attempted
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);

    // Postal still called despite email failure
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);

    // Only 1 delivery proof (POSTAL only, EMAIL failed before storeDeliveryProof)
    expect(mocks.notificationService.NotifyReconductionTaciteJ90).toHaveBeenCalledTimes(1);
  });

  it('missing email skips email channel, postal still attempted', async () => {
    // Return client with no email
    mocks.clientBaseService.Get = jest.fn(() =>
      of({
        id: 'client-1',
        organisation_id: 'org-1',
        email: '',
        nom: 'Dupont',
        prenom: 'Jean',
        adresses: [
          {
            ligne1: '10 Rue de Paris',
            code_postal: '75001',
            ville: 'Paris',
            pays: 'FR',
            type: 'POSTAL',
          },
        ],
      }),
    );

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Email NOT sent (no email address)
    expect(mocks.emailSenderService.sendEmail).not.toHaveBeenCalled();

    // Postal still attempted
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);
  });

  it('missing postal address skips postal, email still attempted', async () => {
    // Return client with email but no addresses
    mocks.clientBaseService.Get = jest.fn(() =>
      of({
        id: 'client-1',
        organisation_id: 'org-1',
        email: 'client@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        adresses: [],
      }),
    );

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Email was sent
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.emailSendCalls[0].to).toBe('client@example.com');

    // Postal NOT sent (no addresses)
    expect(mocks.logisticsService.GenerateLabel).not.toHaveBeenCalled();
  });

  it('L.215-1 legal content contains all 4 required strings', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-1',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    expect(mocks.emailSendCalls).toHaveLength(1);

    const textBody = mocks.emailSendCalls[0].textBody;
    const htmlBody = mocks.emailSendCalls[0].htmlBody;

    // All 4 required legal content strings (check in both text and html bodies)
    expect(textBody).toContain('droit de ne pas renouveler');
    expect(textBody).toContain('Date limite de resiliation');
    expect(textBody).toContain('Conditions de renouvellement');
    expect(textBody).toContain('Modalites de resiliation');

    expect(htmlBody).toContain('droit de ne pas renouveler');
    expect(htmlBody).toContain('Date limite de resiliation');
    expect(htmlBody).toContain('Conditions de renouvellement');
    expect(htmlBody).toContain('Modalites de resiliation');
  });

  it('handles snake_case payload fields (contrat_id, client_id, renewal_date)', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contrat_id: 'contrat-1',
      renewal_date: '2027-01-01T00:00:00.000Z',
      client_id: 'client-1',
    });

    // Should still function correctly with snake_case fields
    expect(mocks.emailSenderService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.logisticsService.GenerateLabel).toHaveBeenCalledTimes(1);
  });

  it('returns early if contrat not found in database', async () => {
    (mocks.contratRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);

    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['crm.reconduction.j90.due']({
      contratId: 'contrat-missing',
      renewalDate: '2027-01-01T00:00:00.000Z',
      clientId: 'client-1',
    });

    // Nothing should happen past contrat lookup
    expect(mocks.emailSenderService.sendEmail).not.toHaveBeenCalled();
    expect(mocks.logisticsService.GenerateLabel).not.toHaveBeenCalled();
    expect(mocks.contratRepository.update).not.toHaveBeenCalled();
  });
});
