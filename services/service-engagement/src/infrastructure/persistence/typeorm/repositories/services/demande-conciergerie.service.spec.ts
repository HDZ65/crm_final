import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DemandeConciergerieService,
  SLA_DELAYS,
} from './demande-conciergerie.service';
import {
  DemandeConciergerie,
  DemandeStatut,
  DemandeCategorie,
  DemandePriorite,
  DemandeCanal,
} from '../../../../../domain/services/entities/demande-conciergerie.entity';

describe('DemandeConciergerieService', () => {
  let service: DemandeConciergerieService;
  let repository: jest.Mocked<Repository<DemandeConciergerie>>;

  const mockEntity: DemandeConciergerie = {
    id: 'uuid-001',
    organisationId: 'org-001',
    clientId: 'client-001',
    reference: 'CONC-ABC12345',
    objet: 'Demande test',
    description: 'Description test',
    categorie: DemandeCategorie.TECHNIQUE,
    canal: DemandeCanal.PORTAIL,
    priorite: DemandePriorite.NORMALE,
    statut: DemandeStatut.NOUVELLE,
    assigneA: null as any,
    creePar: null as any,
    dateLimite: new Date(Date.now() + 48 * 60 * 60 * 1000),
    dateResolution: null as any,
    slaRespected: null as any,
    satisfactionScore: null as any,
    metadata: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandeConciergerieService,
        {
          provide: getRepositoryToken(DemandeConciergerie),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DemandeConciergerieService>(DemandeConciergerieService);
    repository = module.get(getRepositoryToken(DemandeConciergerie));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== SLA DELAY CONSTANTS ==========

  describe('SLA_DELAYS', () => {
    it('should define correct delay for urgente (4 hours)', () => {
      expect(SLA_DELAYS[DemandePriorite.URGENTE]).toBe(4 * 60 * 60 * 1000);
    });

    it('should define correct delay for haute (24 hours)', () => {
      expect(SLA_DELAYS[DemandePriorite.HAUTE]).toBe(24 * 60 * 60 * 1000);
    });

    it('should define correct delay for normale (48 hours)', () => {
      expect(SLA_DELAYS[DemandePriorite.NORMALE]).toBe(48 * 60 * 60 * 1000);
    });

    it('should define correct delay for basse (72 hours)', () => {
      expect(SLA_DELAYS[DemandePriorite.BASSE]).toBe(72 * 60 * 60 * 1000);
    });
  });

  // ========== SLA CALCULATION ==========

  describe('calculateDateLimite', () => {
    const baseDate = new Date('2025-01-15T10:00:00.000Z');

    it('should calculate dateLimite for urgente priority (4h)', () => {
      const result = service.calculateDateLimite(baseDate, DemandePriorite.URGENTE);
      expect(result.getTime()).toBe(baseDate.getTime() + 4 * 60 * 60 * 1000);
      expect(result).toEqual(new Date('2025-01-15T14:00:00.000Z'));
    });

    it('should calculate dateLimite for haute priority (24h)', () => {
      const result = service.calculateDateLimite(baseDate, DemandePriorite.HAUTE);
      expect(result.getTime()).toBe(baseDate.getTime() + 24 * 60 * 60 * 1000);
      expect(result).toEqual(new Date('2025-01-16T10:00:00.000Z'));
    });

    it('should calculate dateLimite for normale priority (48h)', () => {
      const result = service.calculateDateLimite(baseDate, DemandePriorite.NORMALE);
      expect(result.getTime()).toBe(baseDate.getTime() + 48 * 60 * 60 * 1000);
      expect(result).toEqual(new Date('2025-01-17T10:00:00.000Z'));
    });

    it('should calculate dateLimite for basse priority (72h)', () => {
      const result = service.calculateDateLimite(baseDate, DemandePriorite.BASSE);
      expect(result.getTime()).toBe(baseDate.getTime() + 72 * 60 * 60 * 1000);
      expect(result).toEqual(new Date('2025-01-18T10:00:00.000Z'));
    });
  });

  // ========== CREATE WITH SLA ==========

  describe('create', () => {
    it('should create a demande with SLA deadline based on priority', async () => {
      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      const result = await service.create({
        organisationId: 'org-001',
        clientId: 'client-001',
        objet: 'Demande test',
        priorite: DemandePriorite.NORMALE,
      });

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org-001',
          clientId: 'client-001',
          objet: 'Demande test',
          priorite: DemandePriorite.NORMALE,
          statut: DemandeStatut.NOUVELLE,
          dateLimite: expect.any(Date),
        }),
      );
    });

    it('should use NORMALE priority by default', async () => {
      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      await service.create({
        organisationId: 'org-001',
        clientId: 'client-001',
        objet: 'Test',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priorite: DemandePriorite.NORMALE,
        }),
      );
    });

    it('should generate a reference starting with CONC-', async () => {
      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      await service.create({
        organisationId: 'org-001',
        clientId: 'client-001',
        objet: 'Test',
      });

      const createCall = repository.create.mock.calls[0][0] as Partial<DemandeConciergerie>;
      expect(createCall.reference).toMatch(/^CONC-[A-Z0-9]{8}$/);
    });
  });

  // ========== UPDATE WITH SLA CHECK ==========

  describe('update', () => {
    it('should mark slaRespected=true when resolution is before deadline', async () => {
      const demandeWithDeadline: DemandeConciergerie = {
        ...mockEntity,
        dateLimite: new Date('2025-01-17T10:00:00.000Z'),
        dateResolution: null as any,
      };

      repository.findOne.mockResolvedValue(demandeWithDeadline);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.update('uuid-001', {
        dateResolution: new Date('2025-01-16T10:00:00.000Z'), // Before deadline
      });

      expect(result.slaRespected).toBe(true);
    });

    it('should mark slaRespected=false when resolution is after deadline', async () => {
      const demandeWithDeadline: DemandeConciergerie = {
        ...mockEntity,
        dateLimite: new Date('2025-01-17T10:00:00.000Z'),
        dateResolution: null as any,
      };

      repository.findOne.mockResolvedValue(demandeWithDeadline);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.update('uuid-001', {
        dateResolution: new Date('2025-01-18T10:00:00.000Z'), // After deadline
      });

      expect(result.slaRespected).toBe(false);
    });

    it('should recalculate dateLimite when priority changes', async () => {
      const existingDemande: DemandeConciergerie = {
        ...mockEntity,
        createdAt: new Date('2025-01-15T10:00:00.000Z'),
        priorite: DemandePriorite.NORMALE,
      };

      repository.findOne.mockResolvedValue(existingDemande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.update('uuid-001', {
        priorite: DemandePriorite.URGENTE,
      });

      // Should recalculate: 2025-01-15T10:00:00 + 4h = 2025-01-15T14:00:00
      expect(result.dateLimite).toEqual(new Date('2025-01-15T14:00:00.000Z'));
    });

    it('should throw NotFoundException for non-existent demande', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { objet: 'Updated' })).rejects.toThrow(
        'DemandeConciergerie non-existent non trouvée',
      );
    });
  });

  // ========== ASSIGN ==========

  describe('assigner', () => {
    it('should assign user and change status to EN_COURS if NOUVELLE', async () => {
      const nouvelleDemande: DemandeConciergerie = {
        ...mockEntity,
        statut: DemandeStatut.NOUVELLE,
      };

      repository.findOne.mockResolvedValue(nouvelleDemande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.assigner('uuid-001', 'user-123');

      expect(result.assigneA).toBe('user-123');
      expect(result.statut).toBe(DemandeStatut.EN_COURS);
    });

    it('should assign user but keep status if not NOUVELLE', async () => {
      const enCoursDemande: DemandeConciergerie = {
        ...mockEntity,
        statut: DemandeStatut.EN_ATTENTE,
      };

      repository.findOne.mockResolvedValue(enCoursDemande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.assigner('uuid-001', 'user-456');

      expect(result.assigneA).toBe('user-456');
      expect(result.statut).toBe(DemandeStatut.EN_ATTENTE);
    });
  });

  // ========== CLOSE ==========

  describe('cloturer', () => {
    it('should close demande with SLA respected when within deadline', async () => {
      const demande: DemandeConciergerie = {
        ...mockEntity,
        dateLimite: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      repository.findOne.mockResolvedValue(demande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.cloturer('uuid-001', 'Problem resolved');

      expect(result.statut).toBe(DemandeStatut.FERMEE);
      expect(result.dateResolution).toBeInstanceOf(Date);
      expect(result.slaRespected).toBe(true);
      expect(result.metadata?.resolutionNotes).toBe('Problem resolved');
    });

    it('should close demande with SLA violated when past deadline', async () => {
      const demande: DemandeConciergerie = {
        ...mockEntity,
        dateLimite: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      repository.findOne.mockResolvedValue(demande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.cloturer('uuid-001');

      expect(result.statut).toBe(DemandeStatut.FERMEE);
      expect(result.slaRespected).toBe(false);
    });

    it('should set satisfaction score when provided', async () => {
      const demande: DemandeConciergerie = {
        ...mockEntity,
        dateLimite: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      repository.findOne.mockResolvedValue(demande);
      repository.save.mockImplementation(async (entity) => entity as DemandeConciergerie);

      const result = await service.cloturer('uuid-001', 'Resolved', 5);

      expect(result.satisfactionScore).toBe(5);
    });
  });

  // ========== FIND ==========

  describe('findById', () => {
    it('should return a demande by id', async () => {
      repository.findOne.mockResolvedValue(mockEntity);

      const result = await service.findById('uuid-001');

      expect(result).toBeDefined();
      expect(result?.id).toBe('uuid-001');
    });

    it('should return null when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ========== DELETE ==========

  describe('delete', () => {
    it('should delete an existing demande', async () => {
      repository.findOne.mockResolvedValue(mockEntity);
      repository.remove.mockResolvedValue(mockEntity);

      const result = await service.delete('uuid-001');

      expect(result).toBe(true);
      expect(repository.remove).toHaveBeenCalledWith(mockEntity);
    });

    it('should return false when demande not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.delete('non-existent');

      expect(result).toBe(false);
    });
  });
});
