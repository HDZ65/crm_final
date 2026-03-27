import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { of, throwError } from 'rxjs';
import { ShippingNotificationHandler } from '../shipping-notification.handler';

// ============================================================================
// Mock factories
// ============================================================================

function createMocks() {
  const emailsSent: Array<{ to: string; subject: string; htmlBody: string }> = [];
  const notificationsStored: Array<Record<string, unknown>> = [];
  let clientResponse: { id: string; email: string; nom: string; prenom: string; organisation_id: string } | null = {
    id: 'client-1',
    email: 'client@example.com',
    nom: 'Dupont',
    prenom: 'Jean',
    organisation_id: 'org-1',
  };
  let clientFetchShouldThrow = false;

  const clientBaseService = {
    Get: (data: { id: string }) => {
      if (clientFetchShouldThrow) {
        return throwError(() => new Error('gRPC unavailable'));
      }
      return of(clientResponse);
    },
  };

  const notificationService = {
    NotifyShippingStatusChanged: (data: Record<string, unknown>) => {
      notificationsStored.push(data);
      return of({});
    },
  };

  const natsService = {
    subscribe: async (_subject: string, _callback: (data: unknown) => Promise<void>) => {},
  };

  const emailSenderService = {
    sendEmail: async (args: { to: string; subject: string; htmlBody: string }) => {
      emailsSent.push(args);
      return { messageId: 'msg-1', accepted: true };
    },
  };

  const coreClient = {
    getService: () => clientBaseService,
  };

  const engagementClient = {
    getService: () => notificationService,
  };

  return {
    natsService,
    emailSenderService,
    coreClient,
    engagementClient,
    emailsSent,
    notificationsStored,
    setClientResponse: (resp: typeof clientResponse) => { clientResponse = resp; },
    setClientFetchThrow: (val: boolean) => { clientFetchShouldThrow = val; },
  };
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  const handler = new ShippingNotificationHandler(
    mocks.natsService as any,
    mocks.emailSenderService as any,
    mocks.coreClient as any,
    mocks.engagementClient as any,
  );
  // Simulate onModuleInit gRPC service resolution
  (handler as any).clientBaseService = mocks.coreClient.getService();
  (handler as any).notificationService = mocks.engagementClient.getService();
  return handler;
}

// ============================================================================
// Tests
// ============================================================================

describe('ShippingNotificationHandler', () => {
  let mocks: ReturnType<typeof createMocks>;
  let handler: ShippingNotificationHandler;

  beforeEach(() => {
    mocks = createMocks();
    handler = createHandler(mocks);
  });

  it('EXPEDIE status — sends email with subject "Votre colis a été expédié" and tracking number in body', async () => {
    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-1',
      newStatus: 'expedie',
      trackingNumber: 'TRK123',
      clientId: 'client-1',
    });

    expect(mocks.emailsSent).toHaveLength(1);
    expect(mocks.emailsSent[0].to).toBe('client@example.com');
    expect(mocks.emailsSent[0].subject).toBe('Votre colis a été expédié');
    expect(mocks.emailsSent[0].htmlBody).toContain('TRK123');
  });

  it('LIVRE status — sends email with subject "Votre colis a été livré"', async () => {
    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-2',
      newStatus: 'livre',
      trackingNumber: 'TRK456',
      clientId: 'client-1',
    });

    expect(mocks.emailsSent).toHaveLength(1);
    expect(mocks.emailsSent[0].subject).toBe('Votre colis a été livré');
  });

  it('missing client email — logs warning, no email sent, no crash', async () => {
    mocks.setClientResponse({
      id: 'client-1',
      email: '',
      nom: 'Dupont',
      prenom: 'Jean',
      organisation_id: 'org-1',
    });

    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-3',
      newStatus: 'expedie',
      trackingNumber: 'TRK789',
      clientId: 'client-1',
    });

    // No email should be sent
    expect(mocks.emailsSent).toHaveLength(0);
    // No notification stored either (flow exits early)
    expect(mocks.notificationsStored).toHaveLength(0);
  });

  it('delivery proof stored — NotifyShippingStatusChanged called with correct expedition_id after email', async () => {
    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-4',
      newStatus: 'livre',
      trackingNumber: 'TRK-PROOF',
      clientId: 'client-1',
    });

    // Email sent first
    expect(mocks.emailsSent).toHaveLength(1);

    // Then notification stored via gRPC
    expect(mocks.notificationsStored).toHaveLength(1);
    expect(mocks.notificationsStored[0].expedition_id).toBe('exp-4');
    expect(mocks.notificationsStored[0].client_id).toBe('client-1');
    expect(mocks.notificationsStored[0].organisation_id).toBe('org-1');
    expect(mocks.notificationsStored[0].new_status).toBe('livre');
    expect(mocks.notificationsStored[0].tracking_number).toBe('TRK-PROOF');
  });

  it('unknown status — no email sent, no crash', async () => {
    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-5',
      newStatus: 'UNKNOWN_STATUS',
      clientId: 'client-1',
    });

    expect(mocks.emailsSent).toHaveLength(0);
    expect(mocks.notificationsStored).toHaveLength(0);
  });

  it('gRPC client fetch failure — no email sent, no crash', async () => {
    mocks.setClientFetchThrow(true);

    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-6',
      newStatus: 'expedie',
      trackingNumber: 'TRK-FAIL',
      clientId: 'client-1',
    });

    expect(mocks.emailsSent).toHaveLength(0);
    expect(mocks.notificationsStored).toHaveLength(0);
  });

  it('null client response — no email sent, no crash', async () => {
    mocks.setClientResponse(null);

    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-7',
      newStatus: 'livre',
      clientId: 'client-1',
    });

    expect(mocks.emailsSent).toHaveLength(0);
  });

  it('email send failure — does not prevent delivery proof storage', async () => {
    mocks.emailSenderService.sendEmail = async () => {
      throw new Error('SMTP timeout');
    };

    await handler.handleShippingStatusChanged({
      expeditionId: 'exp-8',
      newStatus: 'expedie',
      trackingNumber: 'TRK-SMTP-FAIL',
      clientId: 'client-1',
    });

    // Email failed, but notification should still be stored
    expect(mocks.emailsSent).toHaveLength(0);
    expect(mocks.notificationsStored).toHaveLength(1);
    expect(mocks.notificationsStored[0].expedition_id).toBe('exp-8');
  });
});
