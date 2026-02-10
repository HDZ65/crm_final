import { Test, TestingModule } from '@nestjs/testing';
import { WincashController } from './wincash.controller';
import { OperationCashbackService } from '../../persistence/typeorm/repositories/services/operation-cashback.service';
import { WincashService } from '../../external/wincash/wincash.service';
import {
  OperationCashback,
  CashbackStatut,
  CashbackType,
} from '../../../domain/services/entities/operation-cashback.entity';

describe('WincashController', () => {
  let controller: WincashController;
  let operationCashbackService: jest.Mocked<OperationCashbackService>;
  let wincashService: jest.Mocked<WincashService>;

  const mockOperation: Partial<OperationCashback> = {
    id: 'op-uuid-123',
    organisationId: 'org-123',
    clientId: 'client-456',
    reference: 'wc-ext-001',
    type: CashbackType.ACHAT,
    statut: CashbackStatut.EN_ATTENTE,
    montantAchat: 100,
    tauxCashback: 5,
    montantCashback: 5,
    description: 'Test cashback',
    dateAchat: new Date('2025-01-15'),
    dateValidation: null as any,
    dateVersement: null as any,
    metadata: { source: 'wincash' },
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WincashController,
        {
          provide: OperationCashbackService,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            getSummaryByClient: jest.fn(),
          },
        },
        {
          provide: WincashService,
          useValue: {
            syncCashbackOperations: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WincashController>(WincashController);
    operationCashbackService = module.get(OperationCashbackService);
    wincashService = module.get(WincashService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncCashback', () => {
    it('should call wincashService.syncCashbackOperations and return result', async () => {
      wincashService.syncCashbackOperations.mockResolvedValue({
        operationsCreees: 3,
        operationsMisesAJour: 1,
        operationsIgnorees: 0,
        erreurs: 0,
        errors: [],
        syncId: 'sync-abc',
        syncedAt: new Date('2025-01-20'),
      });

      const result = await controller.syncCashback({
        organisation_id: 'org-123',
        force_full_sync: false,
      });

      expect(result.operations_creees).toBe(3);
      expect(result.operations_mises_a_jour).toBe(1);
      expect(result.erreurs).toBe(0);
      expect(result.sync_id).toBe('sync-abc');
      expect(wincashService.syncCashbackOperations).toHaveBeenCalledWith(
        'org-123',
        undefined,
        undefined,
        false,
      );
    });
  });

  describe('getOperation', () => {
    it('should return operation by id', async () => {
      operationCashbackService.findById.mockResolvedValue(mockOperation as OperationCashback);

      const result = await controller.getOperation({ id: 'op-uuid-123' });

      expect(result.operation).toBeDefined();
      expect(result.operation!.id).toBe('op-uuid-123');
      expect(result.operation!.organisation_id).toBe('org-123');
      expect(result.operation!.reference_externe).toBe('wc-ext-001');
    });

    it('should return undefined operation when not found', async () => {
      operationCashbackService.findById.mockResolvedValue(null);

      const result = await controller.getOperation({ id: 'non-existing' });

      expect(result.operation).toBeUndefined();
    });
  });

  describe('listOperations', () => {
    it('should return paginated list of operations', async () => {
      operationCashbackService.findAll.mockResolvedValue({
        data: [mockOperation as OperationCashback],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.listOperations({
        organisation_id: 'org-123',
        pagination: { page: 1, limit: 10, sort_by: '', sort_order: '' },
      });

      expect(result.operations).toHaveLength(1);
      expect(result.pagination!.total).toBe(1);
      expect(result.total_gains).toBeGreaterThanOrEqual(0);
      expect(result.solde_disponible).toBeGreaterThanOrEqual(0);
    });

    it('should pass filter parameters correctly', async () => {
      operationCashbackService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.listOperations({
        organisation_id: 'org-123',
        client_id: 'client-456',
        statut: 1, // EN_ATTENTE
        search: 'test',
        pagination: { page: 1, limit: 10, sort_by: '', sort_order: '' },
      });

      expect(operationCashbackService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org-123',
          clientId: 'client-456',
          statut: CashbackStatut.EN_ATTENTE,
          search: 'test',
        }),
        { page: 1, limit: 10 },
      );
    });
  });
});
