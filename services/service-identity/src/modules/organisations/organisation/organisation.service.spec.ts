import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { OrganisationService } from './organisation.service';
import { OrganisationEntity } from './entities/organisation.entity';

describe('OrganisationService', () => {
  let service: OrganisationService;
  let repository: jest.Mocked<Repository<OrganisationEntity>>;

  const mockOrganisation: OrganisationEntity = {
    id: 'org-uuid-1',
    nom: 'Test Organisation',
    description: 'Description de test',
    siret: '12345678901234',
    adresse: '123 Rue Test, 75001 Paris',
    telephone: '0145678900',
    email: 'contact@test-org.com',
    actif: true,
    etat: 'actif',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockOrganisation], 1]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationService,
        {
          provide: getRepositoryToken(OrganisationEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<OrganisationService>(OrganisationService);
    repository = module.get(getRepositoryToken(OrganisationEntity));
    
    (repository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createInput = {
      nom: 'Nouvelle Organisation',
      description: 'Description',
      siret: '98765432109876',
      email: 'contact@nouvelle-org.com',
    };

    it('should create a new organisation successfully', async () => {
      repository.create.mockReturnValue(mockOrganisation);
      repository.save.mockResolvedValue(mockOrganisation);

      const result = await service.create(createInput);

      expect(result).toEqual(mockOrganisation);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Nouvelle Organisation',
          actif: true,
          etat: 'actif',
        }),
      );
    });

    it('should set default values when not provided', async () => {
      repository.create.mockReturnValue(mockOrganisation);
      repository.save.mockResolvedValue(mockOrganisation);

      await service.create({ nom: 'Test' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Test',
          actif: true,
          etat: 'actif',
          description: null,
          siret: null,
        }),
      );
    });

    it('should use provided ID if specified', async () => {
      const inputWithId = { ...createInput, id: 'custom-uuid' };
      repository.create.mockReturnValue({ ...mockOrganisation, id: 'custom-uuid' });
      repository.save.mockResolvedValue({ ...mockOrganisation, id: 'custom-uuid' });

      await service.create(inputWithId);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-uuid',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return organisation when found', async () => {
      repository.findOne.mockResolvedValue(mockOrganisation);

      const result = await service.findById('org-uuid-1');

      expect(result).toEqual(mockOrganisation);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'org-uuid-1' },
      });
    });

    it('should throw NOT_FOUND when organisation does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(RpcException);
      await expect(service.findById('nonexistent-id')).rejects.toMatchObject({
        error: expect.objectContaining({
          code: status.NOT_FOUND,
        }),
      });
    });
  });

  describe('update', () => {
    const updateInput = {
      id: 'org-uuid-1',
      nom: 'Organisation Mise a Jour',
      email: 'nouveau@email.com',
    };

    it('should update organisation successfully', async () => {
      const updatedOrg = { ...mockOrganisation, nom: 'Organisation Mise a Jour', email: 'nouveau@email.com' };
      repository.findOne.mockResolvedValue({ ...mockOrganisation });
      repository.save.mockResolvedValue(updatedOrg);

      const result = await service.update(updateInput);

      expect(result.nom).toBe('Organisation Mise a Jour');
      expect(result.email).toBe('nouveau@email.com');
    });

    it('should throw NOT_FOUND when updating non-existent organisation', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(updateInput)).rejects.toThrow(RpcException);
    });
  });

  describe('findAll', () => {
    it('should return paginated organisations', async () => {
      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result.organisations).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      await service.findAll({ search: 'Test' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(o.nom ILIKE :search OR o.email ILIKE :search)',
        { search: '%Test%' },
      );
    });

    it('should apply actif filter', async () => {
      await service.findAll({ actif: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'o.actif = :actif',
        { actif: true },
      );
    });
  });

  describe('delete', () => {
    it('should return true when organisation is deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete('org-uuid-1');

      expect(result).toBe(true);
    });

    it('should return false when organisation does not exist', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent-id');

      expect(result).toBe(false);
    });
  });
});
