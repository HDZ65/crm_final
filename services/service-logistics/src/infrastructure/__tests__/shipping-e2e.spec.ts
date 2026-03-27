/**
 * E2E Integration Test — Shipping Notifications Workflow
 *
 * Exercises the full pipeline:
 *   Status change → NATS event → email notification → delivery proof
 *   + Return label creation E2E
 *
 * All external dependencies are mocked (no real DB / network).
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import { of } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { ShippingNotificationHandler } from '../messaging/nats/handlers/shipping-notification.handler';
import { ReturnLabelService } from '../../domain/logistics/services/return-label.service';
import { RetourExpeditionStatus } from '../../domain/logistics/entities/retour-expedition.entity';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createShippingMocks() {
  const emailsSent: Array<{ to: string; subject: string; htmlBody: string }> = [];
  const proofsStored: unknown[] = [];

  const clientBaseService = {
    Get: (_data: { id: string }) =>
      of({ id: 'client-1', email: 'client@example.com', organisation_id: 'org-1', nom: 'Dupont', prenom: 'Jean' }),
  };

  const notificationService = {
    NotifyShippingStatusChanged: (data: unknown) => {
      proofsStored.push(data);
      return of({});
    },
  };

  const natsService = {
    subscribe: async (_subject: string, _cb: (data: unknown) => Promise<void>) => {},
  };

  const emailSenderService = {
    sendEmail: async (opts: { to: string; subject: string; htmlBody: string }) => {
      emailsSent.push(opts);
      return { messageId: 'msg-e2e', accepted: true };
    },
  };

  const coreClient = { getService: () => clientBaseService };
  const engagementClient = { getService: () => notificationService };

  return { natsService, emailSenderService, coreClient, engagementClient, emailsSent, proofsStored };
}

function createHandler(mocks: ReturnType<typeof createShippingMocks>) {
  return new ShippingNotificationHandler(
    mocks.natsService as any,
    mocks.emailSenderService as any,
    mocks.coreClient as any,
    mocks.engagementClient as any,
  );
}

function createReturnLabelMocks() {
  const createCalls: unknown[] = [];
  const updateCalls: unknown[] = [];
  const labelCalls: unknown[] = [];

  const expeditionService = {
    findById: async (_id: string) => ({ id: 'exp-1', etat: 'LIVRE' }),
  };

  const retourExpeditionService = {
    create: async (data: unknown) => {
      createCalls.push(data);
      return { id: 'retour-1', ...data as object };
    },
    updateStatus: async (_id: string, _status: string, extra: unknown) => {
      updateCalls.push({ _id, _status, extra });
      return {
        id: 'retour-1',
        status: RetourExpeditionStatus.ETIQUETTE_GENEREE,
        labelUrl: 'http://label.pdf',
        trackingNumber: 'TRK-RETURN',
      };
    },
  };

  const mailevaService = {
    generateLabel: async (data: unknown) => {
      labelCalls.push(data);
      return { trackingNumber: 'TRK-RETURN', labelUrl: 'http://label.pdf' };
    },
  };

  return { expeditionService, retourExpeditionService, mailevaService, createCalls, updateCalls, labelCalls };
}

function createReturnLabelService(mocks: ReturnType<typeof createReturnLabelMocks>) {
  return new ReturnLabelService(
    mocks.expeditionService as any,
    mocks.retourExpeditionService as any,
    mocks.mailevaService as any,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Shipping Notifications — E2E Integration', () => {
  describe('ShippingNotificationHandler', () => {
    let mocks: ReturnType<typeof createShippingMocks>;

    beforeEach(() => {
      mocks = createShippingMocks();
    });

    it('Scenario 1: Full EXPEDIE → LIVRE pipeline — 2 emails, 2 delivery proofs', async () => {
      const handler = createHandler(mocks);
      await handler.onModuleInit();

      // EXPEDIE
      await handler.handleShippingStatusChanged({
        expeditionId: 'exp-1',
        newStatus: 'expedie',
        trackingNumber: 'TRK123',
        clientId: 'client-1',
      });

      expect(mocks.emailsSent.length).toBe(1);
      expect(mocks.emailsSent[0].subject).toContain('expédié');
      expect(mocks.emailsSent[0].htmlBody).toContain('TRK123');
      expect(mocks.proofsStored.length).toBe(1);
      expect((mocks.proofsStored[0] as any).expedition_id).toBe('exp-1');

      // LIVRE
      await handler.handleShippingStatusChanged({
        expeditionId: 'exp-1',
        newStatus: 'livre',
        clientId: 'client-1',
      });

      expect(mocks.emailsSent.length).toBe(2);
      expect(mocks.emailsSent[1].subject).toContain('livré');
      expect(mocks.proofsStored.length).toBe(2);
    });

    it('Scenario 2: Missing client email — graceful skip, no email sent, no crash', async () => {
      // Override: client has no email
      const noEmailMocks = createShippingMocks();
      (noEmailMocks.coreClient as any).getService = () => ({
        Get: () => of({ id: 'client-2', email: '', organisation_id: 'org-1', nom: 'X', prenom: 'Y' }),
      });
      const handler = createHandler(noEmailMocks);
      await handler.onModuleInit();

      await expect(
        handler.handleShippingStatusChanged({
          expeditionId: 'exp-2',
          newStatus: 'expedie',
          clientId: 'client-no-email',
        }),
      ).resolves.toBeUndefined();

      expect(noEmailMocks.emailsSent.length).toBe(0);
    });
  });

  describe('ReturnLabelService', () => {
    let mocks: ReturnType<typeof createReturnLabelMocks>;

    beforeEach(() => {
      mocks = createReturnLabelMocks();
    });

    it('Scenario 3: Return label creation E2E — Maileva called before persist, entity has ETIQUETTE_GENEREE', async () => {
      const service = createReturnLabelService(mocks);
      const callOrder: string[] = [];

      mocks.mailevaService.generateLabel = async (data: unknown) => {
        callOrder.push('maileva');
        mocks.labelCalls.push(data);
        return { trackingNumber: 'TRK-RETURN', labelUrl: 'http://label.pdf' };
      };
      mocks.retourExpeditionService.create = async (data: unknown) => {
        callOrder.push('create');
        mocks.createCalls.push(data);
        return { id: 'retour-1', ...data as object };
      };

      const result = await service.createReturnLabel('exp-1', 'Produit défectueux', 'client-1');

      // Maileva called before persist
      expect(callOrder[0]).toBe('maileva');
      expect(callOrder[1]).toBe('create');

      // Result has correct status and label
      expect(result.status).toBe(RetourExpeditionStatus.ETIQUETTE_GENEREE);
      expect(result.labelUrl).toBe('http://label.pdf');
    });

    it('Scenario 4: Expedition not in returnable state — RpcException FAILED_PRECONDITION, no persist', async () => {
      mocks.expeditionService.findById = async () => ({ id: 'exp-1', etat: 'en_transit' } as any);
      const service = createReturnLabelService(mocks);

      let thrown: unknown;
      try {
        await service.createReturnLabel('exp-1', 'reason', 'client-1');
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(RpcException);
      expect((thrown as RpcException).getError()).toMatchObject({ code: GrpcStatus.FAILED_PRECONDITION });
      expect(mocks.createCalls.length).toBe(0);
    });
  });
});
