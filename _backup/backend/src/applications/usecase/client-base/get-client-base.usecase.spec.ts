import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetClientBaseUseCase } from './get-client-base.usecase';
import { ClientBaseEntity } from '../../../core/domain/client-base.entity';
import { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';

describe('GetClientBaseUseCase', () => {
  let useCase: GetClientBaseUseCase;
  let mockRepository: jest.Mocked<ClientBaseRepositoryPort>;

  const mockClientBase: ClientBaseEntity = new ClientBaseEntity({
    id: '123e4567-e89b-12d3-a456-426614174000',
    organisationId: 'org-123',
    typeClient: 'particulier',
    nom: 'Dupont',
    prenom: 'Jean',
    compteCode: 'CL-001',
    partenaireId: 'part-123',
    dateCreation: new Date('2024-01-01'),
    telephone: '0612345678',
    email: 'jean.dupont@example.com',
    statut: 'ACTIF',
  });

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByPhoneAndName: jest.fn(),
      findAllWithContrats: jest.fn(),
      findByIdWithContrats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetClientBaseUseCase,
        {
          provide: 'ClientBaseRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetClientBaseUseCase>(GetClientBaseUseCase);
  });

  describe('execute', () => {
    it('should return a client when found by id', async () => {
      mockRepository.findById.mockResolvedValue(mockClientBase);

      const result = await useCase.execute('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockClientBase);
      expect(mockRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        'ClientBase with id non-existent-id not found',
      );
    });
  });

  describe('executeAll', () => {
    it('should return all clients', async () => {
      const mockClients = [mockClientBase];
      mockRepository.findAll.mockResolvedValue(mockClients);

      const result = await useCase.executeAll();

      expect(result).toEqual(mockClients);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no clients exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await useCase.executeAll();

      expect(result).toEqual([]);
    });
  });

  describe('executeWithContrats', () => {
    it('should return a client with contrats when found', async () => {
      const mockClientWithContrats = {
        ...mockClientBase,
        contrats: [
          {
            id: 'contrat-1',
            reference: 'CTR-001',
            titre: 'Contrat Test',
            dateDebut: '2024-01-01',
            dateFin: null,
            statut: 'actif',
            montant: 1000,
          },
        ],
      };
      mockRepository.findByIdWithContrats.mockResolvedValue(mockClientWithContrats);

      const result = await useCase.executeWithContrats('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockClientWithContrats);
      expect(mockRepository.findByIdWithContrats).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockRepository.findByIdWithContrats.mockResolvedValue(null);

      await expect(useCase.executeWithContrats('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('executeAllWithContrats', () => {
    it('should return clients with filters', async () => {
      const mockClients = [
        {
          ...mockClientBase,
          contrats: [],
        },
      ];
      mockRepository.findAllWithContrats.mockResolvedValue(mockClients);

      const filters = { organisationId: 'org-123' };
      const result = await useCase.executeAllWithContrats(filters);

      expect(result).toEqual(mockClients);
      expect(mockRepository.findAllWithContrats).toHaveBeenCalledWith(filters);
    });
  });
});
