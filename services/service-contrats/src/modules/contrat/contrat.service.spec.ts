import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ContratService } from './contrat.service';
import { ContratEntity } from './entities/contrat.entity';

describe('ContratService', () => {
  let service: ContratService;
  let repository: jest.Mocked<Repository<ContratEntity>>;

  const mockContrat: ContratEntity = {
    id: 'contrat-uuid-1',
    organisationId: 'org-uuid-1',
    reference: 'CTR-2024-001',
    titre: 'Contrat de service',
    description: 'Description du contrat',
    type: 'SERVICE',
    statut: 'ACTIF',
    dateDebut: '2024-01-01',
    dateFin: '2024-12-31',
    dateSignature: '2024-01-01',
    montant: 10000,
    devise: 'EUR',
    frequenceFacturation: 'MENSUELLE',
    documentUrl: null,
    fournisseur: 'Fournisseur A',
    clientId: 'client-uuid-1',
    commercialId: 'commercial-uuid-1',
    societeId: 'societe-uuid-1',
    notes: null,
    lignes: [],
    historique: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContratService,
        {
          provide: getRepositoryToken(ContratEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContratService>(ContratService);
    repository = module.get(getRepositoryToken(ContratEntity));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createInput = {
      organisationId: 'org-uuid-1',
      reference: 'CTR-2024-001',
      titre: 'Contrat de service',
      statut: 'ACTIF',
      dateDebut: '2024-01-01',
      clientId: 'client-uuid-1',
      commercialId: 'commercial-uuid-1',
    };

    it('should create a new contrat successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockContrat);
      repository.save.mockResolvedValue(mockContrat);

      const result = await service.create(createInput);

      expect(result).toEqual(mockContrat);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'CTR-2024-001',
          statut: 'ACTIF',
        }),
      );
    });

    it('should throw ALREADY_EXISTS if contrat with same reference exists', async () => {
      repository.findOne.mockResolvedValue(mockContrat);

      await expect(service.create(createInput)).rejects.toThrow(RpcException);
      await expect(service.create(createInput)).rejects.toMatchObject({
        error: expect.objectContaining({
          code: status.ALREADY_EXISTS,
        }),
      });
    });

    it('should use EUR as default devise', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockContrat);
      repository.save.mockResolvedValue(mockContrat);

      await service.create(createInput);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          devise: 'EUR',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return contrat when found', async () => {
      repository.findOne.mockResolvedValue(mockContrat);

      const result = await service.findById('contrat-uuid-1');

      expect(result).toEqual(mockContrat);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'contrat-uuid-1' },
      });
    });

    it('should throw NOT_FOUND when contrat does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(RpcException);
      await expect(service.findById('nonexistent-id')).rejects.toMatchObject({
        error: expect.objectContaining({
          code: status.NOT_FOUND,
        }),
      });
    });
  });

  describe('findByIdWithDetails', () => {
    it('should return contrat with relations', async () => {
      repository.findOne.mockResolvedValue(mockContrat);

      const result = await service.findByIdWithDetails('contrat-uuid-1');

      expect(result).toEqual(mockContrat);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'contrat-uuid-1' },
        relations: ['lignes', 'historique'],
      });
    });
  });

  describe('findByReference', () => {
    it('should return contrat when found by reference', async () => {
      repository.findOne.mockResolvedValue(mockContrat);

      const result = await service.findByReference('org-uuid-1', 'CTR-2024-001');

      expect(result).toEqual(mockContrat);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { organisationId: 'org-uuid-1', reference: 'CTR-2024-001' },
      });
    });

    it('should throw NOT_FOUND when reference does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByReference('org-uuid-1', 'UNKNOWN')).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    const updateInput = {
      id: 'contrat-uuid-1',
      titre: 'Nouveau titre',
      montant: 15000,
    };

    it('should update contrat successfully', async () => {
      const updatedContrat = { ...mockContrat, titre: 'Nouveau titre', montant: 15000 };
      repository.findOne.mockResolvedValue({ ...mockContrat });
      repository.save.mockResolvedValue(updatedContrat);

      const result = await service.update(updateInput);

      expect(result.titre).toBe('Nouveau titre');
      expect(result.montant).toBe(15000);
    });

    it('should throw NOT_FOUND when updating non-existent contrat', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(updateInput)).rejects.toThrow(RpcException);
    });

    it('should only update provided fields', async () => {
      repository.findOne.mockResolvedValue({ ...mockContrat });
      repository.save.mockImplementation((entity) => Promise.resolve(entity as ContratEntity));

      await service.update({ id: 'contrat-uuid-1', titre: 'Nouveau' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          titre: 'Nouveau',
          reference: 'CTR-2024-001', // unchanged
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated contrats', async () => {
      repository.findAndCount.mockResolvedValue([[mockContrat], 1]);

      const result = await service.findAll(
        { organisationId: 'org-uuid-1' },
        { page: 1, limit: 10 },
      );

      expect(result.contrats).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply filters', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        organisationId: 'org-uuid-1',
        clientId: 'client-uuid-1',
        statut: 'ACTIF',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-uuid-1',
            clientId: 'client-uuid-1',
            statut: 'ACTIF',
          }),
        }),
      );
    });

    it('should use default pagination values', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should return true when contrat is deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete('contrat-uuid-1');

      expect(result).toBe(true);
    });

    it('should return false when contrat does not exist', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent-id');

      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update contrat status', async () => {
      const updatedContrat = { ...mockContrat, statut: 'TERMINE' };
      repository.findOne.mockResolvedValue({ ...mockContrat });
      repository.save.mockResolvedValue(updatedContrat);

      const result = await service.updateStatus('contrat-uuid-1', 'TERMINE');

      expect(result.statut).toBe('TERMINE');
    });

    it('should throw NOT_FOUND for non-existent contrat', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent-id', 'TERMINE')).rejects.toThrow(RpcException);
    });
  });
});
