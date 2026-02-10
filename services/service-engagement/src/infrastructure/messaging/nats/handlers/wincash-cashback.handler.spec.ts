import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WincashCashbackHandler } from './wincash-cashback.handler';
import {
  OperationCashback,
  CashbackStatut,
  CashbackType,
} from '../../../../domain/services/entities/operation-cashback.entity';

describe('WincashCashbackHandler', () => {
  let handler: WincashCashbackHandler;
  let repository: jest.Mocked<Repository<OperationCashback>>;

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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WincashCashbackHandler,
        {
          provide: getRepositoryToken(OperationCashback),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<WincashCashbackHandler>(WincashCashbackHandler);
    repository = module.get(getRepositoryToken(OperationCashback));
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleCashbackCreated', () => {
    it('should create a new cashback operation', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockOperation as OperationCashback);
      repository.save.mockResolvedValue(mockOperation as OperationCashback);

      const result = await handler.handleCashbackCreated({
        externalId: 'wc-ext-001',
        customerId: 'client-456',
        contratId: 'contrat-789',
        organisationId: 'org-123',
        type: 'gain',
        montantAchat: 100,
        tauxCashback: 5,
        montantCashback: 5,
        dateAchat: '2025-01-15T10:00:00Z',
        description: 'Cashback on contract',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('op-uuid-123');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { reference: 'wc-ext-001' },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should skip duplicate operations', async () => {
      repository.findOne.mockResolvedValue(mockOperation as OperationCashback);

      const result = await handler.handleCashbackCreated({
        externalId: 'wc-ext-001',
        customerId: 'client-456',
        contratId: 'contrat-789',
        organisationId: 'org-123',
        type: 'gain',
        montantAchat: 100,
        tauxCashback: 5,
        montantCashback: 5,
        dateAchat: '2025-01-15T10:00:00Z',
      });

      expect(result).toEqual(mockOperation);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should map cashback types correctly', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockOperation as OperationCashback);
      repository.save.mockResolvedValue(mockOperation as OperationCashback);

      await handler.handleCashbackCreated({
        externalId: 'wc-ext-002',
        customerId: 'client-456',
        contratId: 'contrat-789',
        organisationId: 'org-123',
        type: 'parrainage',
        montantAchat: 50,
        tauxCashback: 10,
        montantCashback: 5,
        dateAchat: '2025-01-15T10:00:00Z',
      });

      const createCall = repository.create.mock.calls[0][0] as any;
      expect(createCall.type).toBe(CashbackType.PARRAINAGE);
    });
  });

  describe('handleCashbackValidated', () => {
    it('should update status to VALIDEE', async () => {
      const operation = { ...mockOperation } as OperationCashback;
      repository.findOne.mockResolvedValue(operation);
      repository.save.mockResolvedValue({ ...operation, statut: CashbackStatut.VALIDEE } as OperationCashback);

      await handler.handleCashbackValidated({
        externalId: 'wc-ext-001',
        validePar: 'admin-user',
        dateValidation: '2025-01-20T10:00:00Z',
      });

      expect(repository.save).toHaveBeenCalled();
      expect(operation.statut).toBe(CashbackStatut.VALIDEE);
      expect(operation.validePar).toBe('admin-user');
    });

    it('should handle non-existing operation gracefully', async () => {
      repository.findOne.mockResolvedValue(null);

      await handler.handleCashbackValidated({
        externalId: 'non-existing',
        dateValidation: '2025-01-20T10:00:00Z',
      });

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleCashbackExpired', () => {
    it('should update status to ANNULEE', async () => {
      const operation = { ...mockOperation } as OperationCashback;
      repository.findOne.mockResolvedValue(operation);
      repository.save.mockResolvedValue({ ...operation, statut: CashbackStatut.ANNULEE } as OperationCashback);

      await handler.handleCashbackExpired({
        externalId: 'wc-ext-001',
        expiredAt: '2025-06-01T00:00:00Z',
      });

      expect(repository.save).toHaveBeenCalled();
      expect(operation.statut).toBe(CashbackStatut.ANNULEE);
    });

    it('should handle non-existing operation gracefully', async () => {
      repository.findOne.mockResolvedValue(null);

      await handler.handleCashbackExpired({
        externalId: 'non-existing',
        expiredAt: '2025-06-01T00:00:00Z',
      });

      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
