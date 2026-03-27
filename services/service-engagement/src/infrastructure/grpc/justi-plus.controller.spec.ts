import { Test, TestingModule } from '@nestjs/testing';
import { JustiPlusController } from './justi-plus.controller';
import { CasJuridiqueRepository } from '../persistence/typeorm/repositories/services/cas-juridique.service';
import { JustiPlusService } from '../external/justi-plus/justi-plus.service';
import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
  CasJuridiquePriorite,
} from '../../domain/services/entities/cas-juridique.entity';

describe('JustiPlusController', () => {
  let controller: JustiPlusController;
  let casJuridiqueRepository: jest.Mocked<CasJuridiqueRepository>;
  let justiPlusService: jest.Mocked<JustiPlusService>;

  const mockEntity: CasJuridique = {
    id: 'uuid-001',
    organisationId: 'org-001',
    clientId: 'client-001',
    reference: 'JP-abc123',
    titre: 'Litige bail commercial',
    description: 'Test description',
    type: CasJuridiqueType.LITIGE,
    statut: CasJuridiqueStatut.EN_COURS,
    priorite: CasJuridiquePriorite.NORMALE,
    avocatId: 'Me. Dupont',
    assigneA: null,
    creePar: null,
    montantEnjeu: 5000,
    montantProvision: 250,
    dateOuverture: new Date('2025-01-15'),
    dateAudience: null,
    dateCloture: null,
    metadata: { domaineJuridique: 'droit immobilier', source: 'justi-plus' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JustiPlusController,
        {
          provide: CasJuridiqueRepository,
          useValue: {
            findById: jest.fn(),
            findByReference: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JustiPlusService,
          useValue: {
            fetchCases: jest.fn(),
            suspendSubscription: jest.fn(),
            resumeSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JustiPlusController>(JustiPlusController);
    casJuridiqueRepository = module.get(CasJuridiqueRepository);
    justiPlusService = module.get(JustiPlusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCas', () => {
    it('should return a case by id', async () => {
      casJuridiqueRepository.findById.mockResolvedValue(mockEntity);

      const result = await controller.getCas({ id: 'uuid-001' });

      expect(result.cas).toBeDefined();
      expect(result.cas?.id).toBe('uuid-001');
      expect(result.cas?.titre).toBe('Litige bail commercial');
      expect(result.cas?.reference_externe).toBe('JP-abc123');
    });

    it('should return undefined cas when not found', async () => {
      casJuridiqueRepository.findById.mockResolvedValue(null);

      const result = await controller.getCas({ id: 'non-existent' });

      expect(result.cas).toBeUndefined();
    });
  });

  describe('listCas', () => {
    it('should return paginated list of cases', async () => {
      casJuridiqueRepository.findAll.mockResolvedValue({
        data: [mockEntity],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await controller.listCas({
        organisation_id: 'org-001',
        pagination: { page: 1, limit: 20, sort_by: '', sort_order: '' },
      });

      expect(result.cas).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });
  });

  describe('syncCas', () => {
    it('should sync cases from Justi+ and return stats', async () => {
      justiPlusService.fetchCases.mockResolvedValue({
        cases: [
          {
            externalId: 'JP-new-001',
            clientId: 'client-001',
            contratId: 'contrat-001',
            organisationId: 'org-001',
            titre: 'New case',
            description: 'New case desc',
            type: 'litige',
            statut: 'ouvert',
            domaineJuridique: 'droit immobilier',
            avocatAssigne: 'Me. Test',
            dateOuverture: new Date().toISOString(),
            montantCouvert: 1000,
            montantFranchise: 100,
          },
        ],
        totalFetched: 1,
        syncTimestamp: new Date().toISOString(),
      });

      casJuridiqueRepository.findByReference.mockResolvedValue(null);
      casJuridiqueRepository.create.mockResolvedValue(mockEntity);

      const result = await controller.syncCas({
        organisation_id: 'org-001',
        force_full_sync: false,
      });

      expect(result.sync_id).toBeDefined();
      expect(result.cas_crees).toBe(1);
      expect(result.erreurs).toBe(0);
    });

    it('should update existing cases during sync', async () => {
      justiPlusService.fetchCases.mockResolvedValue({
        cases: [
          {
            externalId: 'JP-abc123',
            clientId: 'client-001',
            contratId: 'contrat-001',
            organisationId: 'org-001',
            titre: 'Updated title',
            description: 'Updated desc',
            type: 'litige',
            statut: 'en_cours',
            domaineJuridique: 'droit immobilier',
            avocatAssigne: 'Me. Dupont',
            dateOuverture: new Date().toISOString(),
            montantCouvert: 5000,
            montantFranchise: 250,
          },
        ],
        totalFetched: 1,
        syncTimestamp: new Date().toISOString(),
      });

      casJuridiqueRepository.findByReference.mockResolvedValue(mockEntity);
      casJuridiqueRepository.save.mockResolvedValue({
        ...mockEntity,
        titre: 'Updated title',
      });

      const result = await controller.syncCas({
        organisation_id: 'org-001',
        force_full_sync: false,
      });

      expect(result.cas_mis_a_jour).toBe(1);
      expect(result.cas_crees).toBe(0);
    });

    it('should handle fetch errors gracefully', async () => {
      justiPlusService.fetchCases.mockRejectedValue(new Error('API down'));

      const result = await controller.syncCas({
        organisation_id: 'org-001',
        force_full_sync: false,
      });

      expect(result.erreurs).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('FETCH_ERROR');
    });
  });
});
