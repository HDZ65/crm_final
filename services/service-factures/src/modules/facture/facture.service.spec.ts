import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureService } from './facture.service';
import { FactureEntity } from './entities/facture.entity';
import { LigneFactureEntity } from '../ligne-facture/entities/ligne-facture.entity';
import { StatutFactureService } from '../statut-facture/statut-facture.service';

describe('FactureService', () => {
  let service: FactureService;
  let factureRepository: jest.Mocked<Repository<FactureEntity>>;
  let ligneRepository: jest.Mocked<Repository<LigneFactureEntity>>;
  let statutService: jest.Mocked<StatutFactureService>;
  let mockQueryBuilder: any;

  const mockFacture = {
    id: 'facture-uuid-1',
    organisationId: 'org-uuid-1',
    numero: 'FAC-2024-001',
    dateEmission: new Date('2024-01-15'),
    montantHT: 1000,
    montantTTC: 1200,
    statutId: 'statut-brouillon',
    emissionFactureId: 'emission-uuid-1',
    clientBaseId: 'client-uuid-1',
    contratId: 'contrat-uuid-1',
    clientPartenaireId: 'partenaire-uuid-1',
    adresseFacturationId: 'adresse-uuid-1',
    statut: { id: 'statut-brouillon', code: 'BROUILLON', libelle: 'Brouillon' } as any,
    lignes: [] as LigneFactureEntity[],
    createdAt: new Date(),
    updatedAt: new Date(),
    estBrouillon: true,
    canBeValidated: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  } as unknown as FactureEntity;

  const mockLigne: LigneFactureEntity = {
    id: 'ligne-uuid-1',
    factureId: 'facture-uuid-1',
    produitId: 'produit-uuid-1',
    quantite: 10,
    prixUnitaire: 100,
    description: 'Service de test',
    tauxTVA: 20,
    montantHT: 1000,
    montantTVA: 200,
    montantTTC: 1200,
    ordreAffichage: 0,
  } as any;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockFacture], 1]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactureService,
        {
          provide: getRepositoryToken(FactureEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(LigneFactureEntity),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: StatutFactureService,
          useValue: {
            findByCode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FactureService>(FactureService);
    factureRepository = module.get(getRepositoryToken(FactureEntity));
    ligneRepository = module.get(getRepositoryToken(LigneFactureEntity));
    statutService = module.get(StatutFactureService);

    (factureRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createInput = {
      organisationId: 'org-uuid-1',
      dateEmission: new Date('2024-01-15'),
      statutId: 'statut-brouillon',
      emissionFactureId: 'emission-uuid-1',
      clientBaseId: 'client-uuid-1',
      clientPartenaireId: 'partenaire-uuid-1',
      adresseFacturationId: 'adresse-uuid-1',
      lignes: [
        {
          produitId: 'produit-uuid-1',
          quantite: 10,
          prixUnitaire: 100,
          description: 'Service de test',
          tauxTVA: 20,
        },
      ],
    };

    it('should create a facture with lignes', async () => {
      factureRepository.create.mockReturnValue(mockFacture);
      factureRepository.save.mockResolvedValue(mockFacture);
      factureRepository.findOne.mockResolvedValue({ ...mockFacture, lignes: [mockLigne] } as any);
      ligneRepository.save.mockResolvedValue([mockLigne] as any);

      const result = await service.create(createInput);

      expect(result).toBeDefined();
      expect(factureRepository.create).toHaveBeenCalled();
      expect(factureRepository.save).toHaveBeenCalled();
      expect(ligneRepository.save).toHaveBeenCalled();
    });

    it('should calculate montantHT and montantTTC from lignes', async () => {
      factureRepository.create.mockReturnValue(mockFacture);
      factureRepository.save.mockResolvedValue(mockFacture);
      factureRepository.findOne.mockResolvedValue(mockFacture);
      ligneRepository.save.mockResolvedValue([mockLigne] as any);

      await service.create(createInput);

      expect(factureRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          montantHT: expect.any(Number),
          montantTTC: expect.any(Number),
        }),
      );
    });

    it('should create facture without lignes', async () => {
      const inputWithoutLignes = { ...createInput, lignes: undefined };
      factureRepository.create.mockReturnValue(mockFacture);
      factureRepository.save.mockResolvedValue(mockFacture);
      factureRepository.findOne.mockResolvedValue(mockFacture);

      await service.create(inputWithoutLignes);

      expect(ligneRepository.save).not.toHaveBeenCalled();
    });

    it('should use default TVA rate of 20% if not provided', async () => {
      const inputWithoutTVA = {
        ...createInput,
        lignes: [{ produitId: 'p1', quantite: 1, prixUnitaire: 100 }],
      };
      factureRepository.create.mockReturnValue(mockFacture);
      factureRepository.save.mockResolvedValue(mockFacture);
      factureRepository.findOne.mockResolvedValue(mockFacture);

      await service.create(inputWithoutTVA);

      expect(ligneRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ tauxTVA: 20 }),
        ]),
      );
    });
  });

  describe('findById', () => {
    it('should return facture with relations', async () => {
      factureRepository.findOne.mockResolvedValue(mockFacture);

      const result = await service.findById('facture-uuid-1');

      expect(result).toEqual(mockFacture);
      expect(factureRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'facture-uuid-1' },
        relations: ['statut', 'lignes'],
      });
    });

    it('should throw NOT_FOUND when facture does not exist', async () => {
      factureRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(RpcException);
      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        error: expect.objectContaining({ code: status.NOT_FOUND }),
      });
    });
  });

  describe('findByNumero', () => {
    it('should return facture by numero', async () => {
      factureRepository.findOne.mockResolvedValue(mockFacture);

      const result = await service.findByNumero('org-uuid-1', 'FAC-2024-001');

      expect(result).toEqual(mockFacture);
      expect(factureRepository.findOne).toHaveBeenCalledWith({
        where: { organisationId: 'org-uuid-1', numero: 'FAC-2024-001' },
        relations: ['statut', 'lignes'],
      });
    });

    it('should throw NOT_FOUND when numero does not exist', async () => {
      factureRepository.findOne.mockResolvedValue(null);

      await expect(service.findByNumero('org-uuid-1', 'UNKNOWN')).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    it('should update facture', async () => {
      factureRepository.findOne
        .mockResolvedValueOnce(mockFacture)
        .mockResolvedValueOnce(mockFacture);
      factureRepository.save.mockResolvedValue(mockFacture);

      const result = await service.update({
        id: 'facture-uuid-1',
        dateEmission: new Date('2024-02-01'),
      });

      expect(result).toBeDefined();
      expect(factureRepository.save).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when updating non-existent facture', async () => {
      factureRepository.findOne.mockResolvedValue(null);

      await expect(service.update({ id: 'nonexistent' })).rejects.toThrow(RpcException);
    });
  });

  describe('findAll', () => {
    it('should return paginated factures', async () => {
      const result = await service.findAll({ organisationId: 'org-uuid-1' });

      expect(result.factures).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply filters', async () => {
      await service.findAll({
        organisationId: 'org-uuid-1',
        clientBaseId: 'client-uuid-1',
        statutId: 'statut-brouillon',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'f.clientBaseId = :clientId',
        { clientId: 'client-uuid-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'f.statutId = :statutId',
        { statutId: 'statut-brouillon' },
      );
    });

    it('should apply date filters', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      await service.findAll({
        organisationId: 'org-uuid-1',
        dateFrom,
        dateTo,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'f.dateEmission >= :dateFrom',
        { dateFrom },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'f.dateEmission <= :dateTo',
        { dateTo },
      );
    });
  });

  describe('delete', () => {
    it('should return true when facture is deleted', async () => {
      factureRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete('facture-uuid-1');

      expect(result).toBe(true);
    });

    it('should return false when facture does not exist', async () => {
      factureRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return validation result', async () => {
      const factureWithValidation = {
        ...mockFacture,
        canBeValidated: () => ({ valid: true, errors: [] }),
      };
      factureRepository.findOne.mockResolvedValue(factureWithValidation as any);

      const result = await service.validate('facture-uuid-1');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('finalize', () => {
    it('should finalize facture with numero', async () => {
      const mockStatutEmise = { id: 'statut-emise', code: 'EMISE', libelle: 'Emise' };
      const factureWithValidation = {
        ...mockFacture,
        canBeValidated: () => ({ valid: true, errors: [] }),
      };
      factureRepository.findOne
        .mockResolvedValueOnce(factureWithValidation as any)
        .mockResolvedValueOnce({ ...mockFacture, numero: 'FAC-2024-002', statutId: 'statut-emise' } as any);
      factureRepository.save.mockResolvedValue(mockFacture as any);
      statutService.findByCode.mockResolvedValue(mockStatutEmise as any);

      const result = await service.finalize('facture-uuid-1', 'FAC-2024-002');

      expect(statutService.findByCode).toHaveBeenCalledWith('EMISE');
      expect(factureRepository.save).toHaveBeenCalled();
    });

    it('should throw FAILED_PRECONDITION when validation fails', async () => {
      const invalidFacture = {
        ...mockFacture,
        canBeValidated: () => ({ valid: false, errors: ['Missing data'] }),
      };
      factureRepository.findOne.mockResolvedValue(invalidFacture as any);

      await expect(service.finalize('facture-uuid-1', 'FAC-2024-002')).rejects.toThrow(RpcException);
    });
  });
});
