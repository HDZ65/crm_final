import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JustiCaseHandler, JustiCaseEvent } from './justi-case-handler';
import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
} from '../../../../domain/services/entities/cas-juridique.entity';

describe('JustiCaseHandler', () => {
  let handler: JustiCaseHandler;
  let repository: jest.Mocked<Repository<CasJuridique>>;

  const mockCaseEvent: JustiCaseEvent = {
    externalId: 'JP-abc123',
    clientId: 'client-001',
    contratId: 'contrat-001',
    organisationId: 'org-001',
    titre: 'Litige bail commercial',
    description: 'Test case description',
    type: 'litige',
    statut: 'en_cours',
    domaineJuridique: 'droit immobilier',
    avocatAssigne: 'Me. Dupont',
    dateOuverture: '2025-01-15T00:00:00.000Z',
    montantCouvert: 5000,
    montantFranchise: 250,
    notes: 'Test notes',
    metadata: { urgence: false },
    eventType: 'opened',
    timestamp: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JustiCaseHandler,
        {
          provide: getRepositoryToken(CasJuridique),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<JustiCaseHandler>(JustiCaseHandler);
    repository = module.get(getRepositoryToken(CasJuridique));
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleCaseOpened', () => {
    it('should create a new CasJuridique when it does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const mockEntity = {
        id: 'uuid-001',
        reference: 'JP-abc123',
        ...mockCaseEvent,
      } as unknown as CasJuridique;

      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      const result = await handler.handleCaseOpened(mockCaseEvent);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { reference: 'JP-abc123' },
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org-001',
          clientId: 'client-001',
          reference: 'JP-abc123',
          titre: 'Litige bail commercial',
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return existing case when duplicate reference', async () => {
      const existingEntity = {
        id: 'existing-uuid',
        reference: 'JP-abc123',
      } as CasJuridique;

      repository.findOne.mockResolvedValue(existingEntity);

      const result = await handler.handleCaseOpened(mockCaseEvent);

      expect(result).toBe(existingEntity);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('handleCaseUpdated', () => {
    it('should update existing CasJuridique', async () => {
      const existingEntity = {
        id: 'existing-uuid',
        reference: 'JP-abc123',
        titre: 'Old title',
        metadata: { old: true },
      } as unknown as CasJuridique;

      repository.findOne.mockResolvedValue(existingEntity);
      repository.save.mockResolvedValue({
        ...existingEntity,
        titre: mockCaseEvent.titre,
      } as CasJuridique);

      await handler.handleCaseUpdated(mockCaseEvent);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          titre: 'Litige bail commercial',
        }),
      );
    });

    it('should create case if not found on update', async () => {
      repository.findOne.mockResolvedValue(null);

      const mockEntity = {
        id: 'new-uuid',
        reference: 'JP-abc123',
      } as unknown as CasJuridique;
      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      await handler.handleCaseUpdated(mockCaseEvent);

      // It should call handleCaseOpened which triggers create
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('handleCaseClosed', () => {
    it('should close existing CasJuridique', async () => {
      const existingEntity = {
        id: 'existing-uuid',
        reference: 'JP-abc123',
        statut: CasJuridiqueStatut.EN_COURS,
        metadata: {},
      } as unknown as CasJuridique;

      repository.findOne.mockResolvedValue(existingEntity);
      repository.save.mockResolvedValue({
        ...existingEntity,
        statut: CasJuridiqueStatut.CLOS_GAGNE,
      } as CasJuridique);

      const closeEvent = {
        ...mockCaseEvent,
        eventType: 'closed' as const,
        statut: 'resolu',
        dateCloture: '2025-06-01T00:00:00.000Z',
      };

      await handler.handleCaseClosed(closeEvent);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: CasJuridiqueStatut.CLOS_GAGNE,
        }),
      );
    });

    it('should not throw when case not found for close', async () => {
      repository.findOne.mockResolvedValue(null);

      const closeEvent = {
        ...mockCaseEvent,
        eventType: 'closed' as const,
      };

      await handler.handleCaseClosed(closeEvent);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
