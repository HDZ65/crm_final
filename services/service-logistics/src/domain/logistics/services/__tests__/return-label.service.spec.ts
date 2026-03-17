import { describe, expect, it, beforeEach } from 'bun:test';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReturnLabelService } from '../return-label.service';
import { RetourExpeditionStatus } from '../../entities/retour-expedition.entity';

// ============================================================================
// Mock factories
// ============================================================================

interface FakeExpedition {
  id: string;
  etat: string;
  adresseDestination: string | null;
  villeDestination: string | null;
  codePostalDestination: string | null;
}

function createFakeExpedition(overrides: Partial<FakeExpedition> = {}): FakeExpedition {
  return {
    id: 'exp-1',
    etat: 'LIVRE',
    adresseDestination: '12 rue de Paris',
    villeDestination: 'Paris',
    codePostalDestination: '75001',
    ...overrides,
  };
}

function createMocks() {
  let expedition: FakeExpedition | null = createFakeExpedition();
  const createdRetours: Array<{ expeditionId: string; reason: string }> = [];
  const statusUpdates: Array<{ id: string; status: RetourExpeditionStatus; params: Record<string, unknown> }> = [];

  const expeditionService = {
    findById: async (_id: string) => expedition,
  };

  const retourExpeditionService = {
    create: async (params: { expeditionId: string; reason: string }) => {
      createdRetours.push(params);
      return {
        id: 'retour-1',
        expeditionId: params.expeditionId,
        reason: params.reason,
        status: RetourExpeditionStatus.DEMANDE,
        trackingNumber: null,
        labelUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    updateStatus: async (id: string, newStatus: RetourExpeditionStatus, params?: { trackingNumber?: string; labelUrl?: string }) => {
      statusUpdates.push({ id, status: newStatus, params: params as Record<string, unknown> });
      return {
        id,
        expeditionId: 'exp-1',
        reason: 'test',
        status: newStatus,
        trackingNumber: params?.trackingNumber ?? null,
        labelUrl: params?.labelUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  };

  const mailevaService = {
    generateLabel: async (_args: unknown) => ({
      trackingNumber: 'TRK-RETURN',
      labelUrl: 'https://label.test/return',
    }),
  };

  return {
    expeditionService,
    retourExpeditionService,
    mailevaService,
    createdRetours,
    statusUpdates,
    setExpedition: (exp: FakeExpedition | null) => { expedition = exp; },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ReturnLabelService(
    mocks.expeditionService as any,
    mocks.retourExpeditionService as any,
    mocks.mailevaService as any,
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('ReturnLabelService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ReturnLabelService;

  beforeEach(() => {
    mocks = createMocks();
    service = createService(mocks);
  });

  it('happy path — expedition LIVRE, Maileva succeeds → RetourExpedition created with ETIQUETTE_GENEREE and label_url', async () => {
    const result = await service.createReturnLabel('exp-1', 'Produit défectueux', 'client-1');

    // Retour expedition was created
    expect(mocks.createdRetours).toHaveLength(1);
    expect(mocks.createdRetours[0].expeditionId).toBe('exp-1');
    expect(mocks.createdRetours[0].reason).toBe('Produit défectueux');

    // Status was updated to ETIQUETTE_GENEREE with label data
    expect(mocks.statusUpdates).toHaveLength(1);
    expect(mocks.statusUpdates[0].status).toBe(RetourExpeditionStatus.ETIQUETTE_GENEREE);
    expect(mocks.statusUpdates[0].params).toEqual({
      trackingNumber: 'TRK-RETURN',
      labelUrl: 'https://label.test/return',
    });

    // Returned entity has correct fields
    expect(result.status).toBe(RetourExpeditionStatus.ETIQUETTE_GENEREE);
    expect(result.trackingNumber).toBe('TRK-RETURN');
    expect(result.labelUrl).toBe('https://label.test/return');
  });

  it('expedition not found — throws RpcException with NOT_FOUND, nothing persisted', async () => {
    mocks.setExpedition(null);

    let thrownError: RpcException | null = null;
    try {
      await service.createReturnLabel('exp-nonexistent', 'Raison', 'client-1');
    } catch (error) {
      if (error instanceof RpcException) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    const errorObj = thrownError!.getError() as { code: number; message: string };
    expect(errorObj.code).toBe(status.NOT_FOUND);
    expect(errorObj.message).toContain('not found');

    // Nothing persisted
    expect(mocks.createdRetours).toHaveLength(0);
    expect(mocks.statusUpdates).toHaveLength(0);
  });

  it('Maileva failure — throws RpcException with UNAVAILABLE, entity NOT persisted (atomic)', async () => {
    mocks.mailevaService.generateLabel = async () => {
      throw new Error('Maileva service down');
    };

    let thrownError: RpcException | null = null;
    try {
      await service.createReturnLabel('exp-1', 'Produit cassé', 'client-1');
    } catch (error) {
      if (error instanceof RpcException) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    const errorObj = thrownError!.getError() as { code: number; message: string };
    expect(errorObj.code).toBe(status.UNAVAILABLE);
    expect(errorObj.message).toContain('Return label generation failed');

    // Entity NOT persisted (atomic guarantee)
    expect(mocks.createdRetours).toHaveLength(0);
    expect(mocks.statusUpdates).toHaveLength(0);
  });

  it('expedition not in returnable state — throws RpcException with FAILED_PRECONDITION', async () => {
    mocks.setExpedition(createFakeExpedition({ etat: 'en_transit' }));

    let thrownError: RpcException | null = null;
    try {
      await service.createReturnLabel('exp-1', 'Retour demandé', 'client-1');
    } catch (error) {
      if (error instanceof RpcException) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    const errorObj = thrownError!.getError() as { code: number; message: string };
    expect(errorObj.code).toBe(status.FAILED_PRECONDITION);
    expect(errorObj.message).toContain('en_transit');

    // Nothing persisted
    expect(mocks.createdRetours).toHaveLength(0);
  });

  it('isValidTransition — validates status flow DEMANDE → ETIQUETTE_GENEREE → EN_TRANSIT → RECU', () => {
    expect(ReturnLabelService.isValidTransition(
      RetourExpeditionStatus.DEMANDE,
      RetourExpeditionStatus.ETIQUETTE_GENEREE,
    )).toBe(true);

    expect(ReturnLabelService.isValidTransition(
      RetourExpeditionStatus.ETIQUETTE_GENEREE,
      RetourExpeditionStatus.EN_TRANSIT,
    )).toBe(true);

    expect(ReturnLabelService.isValidTransition(
      RetourExpeditionStatus.EN_TRANSIT,
      RetourExpeditionStatus.RECU,
    )).toBe(true);

    // Invalid: skip from DEMANDE to EN_TRANSIT
    expect(ReturnLabelService.isValidTransition(
      RetourExpeditionStatus.DEMANDE,
      RetourExpeditionStatus.EN_TRANSIT,
    )).toBe(false);

    // Terminal: RECU has no next state
    expect(ReturnLabelService.isValidTransition(
      RetourExpeditionStatus.RECU,
      RetourExpeditionStatus.DEMANDE,
    )).toBe(false);
  });
});
