import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateClientBaseUseCase } from './create-client-base.usecase';
import { ClientBaseEntity } from '../../../core/domain/client-base.entity';
import { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';
import { CreateClientBaseDto } from '../../dto/client-base/create-client-base.dto';

describe('CreateClientBaseUseCase', () => {
  let useCase: CreateClientBaseUseCase;
  let mockRepository: jest.Mocked<ClientBaseRepositoryPort>;

  const mockCreateDto: CreateClientBaseDto = {
    organisationId: 'org-123',
    typeClient: 'particulier',
    nom: 'dupont',
    prenom: 'jean',
    compteCode: 'CL-001',
    partenaireId: 'part-123',
    dateCreation: '2024-01-01',
    telephone: '0612345678',
    email: 'jean.dupont@example.com',
    statut: 'ACTIF',
  };

  const mockCreatedClient: ClientBaseEntity = new ClientBaseEntity({
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
        CreateClientBaseUseCase,
        {
          provide: 'ClientBaseRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateClientBaseUseCase>(CreateClientBaseUseCase);
  });

  describe('execute', () => {
    it('should create a new client successfully', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedClient);

      const result = await useCase.execute(mockCreateDto);

      expect(result).toEqual(mockCreatedClient);
      expect(mockRepository.findByPhoneAndName).toHaveBeenCalledWith(
        '0612345678',
        'Dupont',
      );
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should capitalize nom and prenom', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedClient);

      await useCase.execute(mockCreateDto);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.nom).toBe('Dupont');
      expect(createCall.prenom).toBe('Jean');
    });

    it('should throw ConflictException when client already exists', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(mockCreatedClient);

      await expect(useCase.execute(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(useCase.execute(mockCreateDto)).rejects.toThrow(
        'Un client avec le nom dupont et le telephone 0612345678 existe deja.',
      );
    });

    it('should handle optional dateNaissance correctly', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedClient);

      const dtoWithBirthdate = {
        ...mockCreateDto,
        dateNaissance: '1990-05-15',
      };

      await useCase.execute(dtoWithBirthdate);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.dateNaissance).toEqual(new Date('1990-05-15'));
    });

    it('should set dateNaissance to null when not provided', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedClient);

      await useCase.execute(mockCreateDto);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.dateNaissance).toBeNull();
    });

    it('should use default statut ACTIF when not provided', async () => {
      mockRepository.findByPhoneAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedClient);

      const dtoWithoutStatut = { ...mockCreateDto };
      delete dtoWithoutStatut.statut;

      await useCase.execute(dtoWithoutStatut);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.statut).toBe('ACTIF');
    });
  });
});
