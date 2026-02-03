import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UtilisateurService } from './utilisateur.service';
import { UtilisateurEntity } from './entities/utilisateur.entity';

describe('UtilisateurService', () => {
  let service: UtilisateurService;
  let repository: jest.Mocked<Repository<UtilisateurEntity>>;
  let mockQueryBuilder: any;

  const mockUtilisateur: UtilisateurEntity = {
    id: 'user-uuid-1',
    keycloakId: 'keycloak-uuid-1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    telephone: '0612345678',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UtilisateurEntity;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockUtilisateur], 1]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateurService,
        {
          provide: getRepositoryToken(UtilisateurEntity),
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

    service = module.get<UtilisateurService>(UtilisateurService);
    repository = module.get(getRepositoryToken(UtilisateurEntity));

    (repository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createInput = {
      keycloakId: 'keycloak-uuid-new',
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@example.com',
      telephone: '0698765432',
    };

    it('should create a new utilisateur', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUtilisateur);
      repository.save.mockResolvedValue(mockUtilisateur);

      const result = await service.create(createInput);

      expect(result).toEqual(mockUtilisateur);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          keycloakId: createInput.keycloakId,
          email: createInput.email,
          actif: true,
        }),
      );
    });

    it('should throw ALREADY_EXISTS if keycloakId exists', async () => {
      repository.findOne.mockResolvedValue(mockUtilisateur);

      await expect(service.create(createInput)).rejects.toThrow(RpcException);
      await expect(service.create(createInput)).rejects.toMatchObject({
        error: expect.objectContaining({ code: status.ALREADY_EXISTS }),
      });
    });
  });

  describe('findById', () => {
    it('should return utilisateur when found', async () => {
      repository.findOne.mockResolvedValue(mockUtilisateur);

      const result = await service.findById('user-uuid-1');

      expect(result).toEqual(mockUtilisateur);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid-1' } });
    });

    it('should throw NOT_FOUND when utilisateur does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(RpcException);
      await expect(service.findById('nonexistent')).rejects.toMatchObject({
        error: expect.objectContaining({ code: status.NOT_FOUND }),
      });
    });
  });

  describe('findByKeycloakId', () => {
    it('should return utilisateur when found', async () => {
      repository.findOne.mockResolvedValue(mockUtilisateur);

      const result = await service.findByKeycloakId('keycloak-uuid-1');

      expect(result).toEqual(mockUtilisateur);
    });

    it('should return null when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByKeycloakId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update utilisateur', async () => {
      const updatedUser = { ...mockUtilisateur, nom: 'Updated' };
      repository.findOne.mockResolvedValue({ ...mockUtilisateur });
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update({ id: 'user-uuid-1', nom: 'Updated' });

      expect(result.nom).toBe('Updated');
    });

    it('should throw NOT_FOUND when updating non-existent utilisateur', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update({ id: 'nonexistent', nom: 'Test' })).rejects.toThrow(RpcException);
    });
  });

  describe('findAll', () => {
    it('should return paginated utilisateurs', async () => {
      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result.utilisateurs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply search filter', async () => {
      await service.findAll({ search: 'Dupont' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(u.nom ILIKE :search OR u.prenom ILIKE :search OR u.email ILIKE :search)',
        { search: '%Dupont%' },
      );
    });
  });

  describe('delete', () => {
    it('should return true when deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete('user-uuid-1');

      expect(result).toBe(true);
    });

    it('should return false when not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent');

      expect(result).toBe(false);
    });
  });
});
