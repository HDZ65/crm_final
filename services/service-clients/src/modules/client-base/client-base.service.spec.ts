import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientBaseService } from './client-base.service';
import { ClientBaseEntity } from './entities/client-base.entity';

describe('ClientBaseService', () => {
  let service: ClientBaseService;
  let repository: jest.Mocked<Repository<ClientBaseEntity>>;

  const mockClient: ClientBaseEntity = {
    id: 'client-uuid-1',
    organisationId: 'org-uuid-1',
    typeClient: 'PARTICULIER',
    nom: 'Dupont',
    prenom: 'Jean',
    dateNaissance: new Date('1990-01-15'),
    compteCode: 'CLI001',
    partenaireId: 'partner-uuid-1',
    dateCreation: new Date(),
    telephone: '0612345678',
    email: 'jean.dupont@example.com',
    statut: 'ACTIF',
    societeId: null,
    adresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockClient], 1]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientBaseService,
        {
          provide: getRepositoryToken(ClientBaseEntity),
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

    service = module.get<ClientBaseService>(ClientBaseService);
    repository = module.get(getRepositoryToken(ClientBaseEntity));
    
    // Reset the mock for createQueryBuilder after module creation
    (repository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createInput = {
      organisationId: 'org-uuid-1',
      typeClient: 'PARTICULIER',
      nom: 'dupont',
      prenom: 'jean',
      telephone: '0612345678',
      email: 'jean.dupont@example.com',
      compteCode: 'CLI001',
      partenaireId: 'partner-uuid-1',
      dateNaissance: '1990-01-15',
      statut: 'ACTIF',
    };

    it('should create a new client successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockClient);
      repository.save.mockResolvedValue(mockClient);

      const result = await service.create(createInput);

      expect(result).toEqual(mockClient);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Dupont', // Should be capitalized
          prenom: 'Jean', // Should be capitalized
        }),
      );
    });

    it('should throw ALREADY_EXISTS if client with same phone and name exists', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      await expect(service.create(createInput)).rejects.toThrow(RpcException);
      await expect(service.create(createInput)).rejects.toMatchObject({
        error: expect.objectContaining({
          code: status.ALREADY_EXISTS,
        }),
      });
    });

    it('should set default statut to ACTIF if not provided', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockClient);
      repository.save.mockResolvedValue(mockClient);

      await service.create(createInput);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: 'ACTIF',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return client when found', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      const result = await service.findById('client-uuid-1');

      expect(result).toEqual(mockClient);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-uuid-1' },
        relations: ['adresses'],
      });
    });

    it('should throw NOT_FOUND when client does not exist', async () => {
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
      id: 'client-uuid-1',
      nom: 'martin',
      email: 'jean.martin@example.com',
    };

    it('should update client successfully', async () => {
      const updatedClient = { ...mockClient, nom: 'Martin', email: 'jean.martin@example.com' };
      repository.findOne.mockResolvedValue(mockClient);
      repository.save.mockResolvedValue(updatedClient);

      const result = await service.update(updateInput);

      expect(result.nom).toBe('Martin');
      expect(result.email).toBe('jean.martin@example.com');
    });

    it('should throw NOT_FOUND when updating non-existent client', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(updateInput)).rejects.toThrow(RpcException);
    });

    it('should only update provided fields', async () => {
      repository.findOne.mockResolvedValue({ ...mockClient });
      repository.save.mockImplementation((entity) => Promise.resolve(entity as ClientBaseEntity));

      await service.update({ id: 'client-uuid-1', nom: 'Nouveau' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Nouveau',
          prenom: 'Jean', // unchanged
        }),
      );
    });
  });

  describe('findAll', () => {
    const listRequest = {
      organisationId: 'org-uuid-1',
      pagination: { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'DESC' },
    };

    it('should return paginated clients', async () => {
      const result = await service.findAll(listRequest);

      expect(result.clients).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      await service.findAll({ ...listRequest, search: 'Dupont' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(c.nom)'),
        expect.objectContaining({ search: '%Dupont%' }),
      );
    });

    it('should apply statut filter', async () => {
      await service.findAll({ ...listRequest, statutId: 'INACTIF' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.statut = :statut',
        { statut: 'INACTIF' },
      );
    });

    it('should use default pagination values', async () => {
      await service.findAll({ organisationId: 'org-uuid-1' });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('delete', () => {
    it('should return true when client is deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete('client-uuid-1');

      expect(result).toBe(true);
    });

    it('should return false when client does not exist', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent-id');

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return found:true when client exists', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      const result = await service.search('org-uuid-1', '0612345678', 'Dupont');

      expect(result.found).toBe(true);
      expect(result.client).toEqual(mockClient);
    });

    it('should return found:false when client does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.search('org-uuid-1', '0600000000', 'Unknown');

      expect(result.found).toBe(false);
      expect(result.client).toBeNull();
    });
  });

  describe('findByPhoneAndName', () => {
    it('should find client by phone and name with capitalized name', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      await service.findByPhoneAndName('0612345678', 'dupont');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { telephone: '0612345678', nom: 'Dupont' },
      });
    });
  });
});

describe('ClientBaseEntity', () => {
  describe('capitalizeName', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(ClientBaseEntity.capitalizeName('dupont')).toBe('Dupont');
      expect(ClientBaseEntity.capitalizeName('DUPONT')).toBe('Dupont');
      expect(ClientBaseEntity.capitalizeName('DuPoNt')).toBe('Dupont');
    });

    it('should handle empty or null values', () => {
      expect(ClientBaseEntity.capitalizeName('')).toBe('');
      expect(ClientBaseEntity.capitalizeName(null as any)).toBe(null);
    });

    it('should handle single character', () => {
      expect(ClientBaseEntity.capitalizeName('a')).toBe('A');
    });
  });
});
