import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { Repository } from 'typeorm';
import type { NatsService } from '@crm/shared-kernel';
import { RpcException } from '@nestjs/microservices';
import { ControleQualiteService } from '../../../infrastructure/persistence/typeorm/repositories/qualite/controle-qualite.service';
import { ControleQualiteEntity } from '../entities/controle-qualite.entity';
import { StatutCQEntity } from '../entities/statut-cq.entity';
import { StatutCQ } from '../enums/statut-cq.enum';

// --- Factories -----------------------------------------------------------

function makeControle(overrides: Partial<ControleQualiteEntity> = {}): ControleQualiteEntity {
  return {
    id: 'cq-1',
    organisationId: 'org-1',
    contratId: 'contrat-1',
    statut: StatutCQ.EN_ATTENTE,
    validateurId: null,
    score: null,
    dateSoumission: new Date('2026-03-01'),
    dateValidation: null,
    motifRejet: null,
    commentaire: null,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
    resultats: [],
    ...overrides,
  } as ControleQualiteEntity;
}

function makeStatut(overrides: Partial<StatutCQEntity> = {}): StatutCQEntity {
  return {
    id: 'statut-1',
    code: 'EN_ATTENTE',
    nom: 'En attente',
    description: null,
    ordreAffichage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as StatutCQEntity;
}

// --- Mock builders -------------------------------------------------------

function createMocks() {
  const cqRepository = {
    findOne: jest.fn(async () => makeControle()),
    findAndCount: jest.fn(async () => [[makeControle()], 1] as [ControleQualiteEntity[], number]),
    create: jest.fn((data: Partial<ControleQualiteEntity>) => ({ ...makeControle(), ...data })),
    save: jest.fn(async (entity: Partial<ControleQualiteEntity>) => ({
      ...makeControle(),
      ...entity,
    })),
    update: jest.fn(async () => ({ affected: 1 })),
    find: jest.fn(async () => [makeControle()]),
  } as unknown as Repository<ControleQualiteEntity>;

  const statutRepository = {
    findOne: jest.fn(async () => makeStatut()),
    find: jest.fn(async () => [
      makeStatut({ code: 'EN_ATTENTE', ordreAffichage: 0 }),
      makeStatut({ id: 'statut-2', code: 'VALIDE', nom: 'Valide', ordreAffichage: 1 }),
      makeStatut({ id: 'statut-3', code: 'REJETE', nom: 'Rejete', ordreAffichage: 2 }),
    ]),
  } as unknown as Repository<StatutCQEntity>;

  const natsService = {
    publish: jest.fn(async () => undefined),
    subscribe: jest.fn(async () => undefined),
    isConnected: jest.fn(() => true),
  } as unknown as NatsService;

  return { cqRepository, statutRepository, natsService };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ControleQualiteService(
    mocks.cqRepository,
    mocks.statutRepository,
    mocks.natsService,
  );
}

// --- Tests ---------------------------------------------------------------

describe('ControleQualiteService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ControleQualiteService;

  beforeEach(() => {
    mocks = createMocks();
    service = createService(mocks);
  });

  // --- create (soumettreControle) ---

  describe('create (soumettreControle)', () => {
    it('creates a controle with EN_ATTENTE status by default', async () => {
      const result = await service.create('org-1', 'contrat-1');

      expect(mocks.cqRepository.create).toHaveBeenCalledTimes(1);
      const createArg = (mocks.cqRepository.create as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(createArg.organisationId).toBe('org-1');
      expect(createArg.contratId).toBe('contrat-1');
      expect(createArg.statut).toBe(StatutCQ.EN_ATTENTE);
      expect(createArg.dateSoumission).toBeInstanceOf(Date);

      expect(mocks.cqRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result.organisationId).toBe('org-1');
    });

    it('allows explicit initial status', async () => {
      await service.create('org-1', 'contrat-1', StatutCQ.EN_COURS);

      const createArg = (mocks.cqRepository.create as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(createArg.statut).toBe(StatutCQ.EN_COURS);
    });

    it('throws RpcException on repository error', async () => {
      (mocks.cqRepository.save as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('DB_FAILURE'),
      );

      try {
        await service.create('org-1', 'contrat-1');
        expect(true).toBe(false); // should not reach
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
      }
    });
  });

  // --- findById ---

  describe('findById', () => {
    it('returns controle with relations', async () => {
      const result = await service.findById('cq-1');

      expect(mocks.cqRepository.findOne).toHaveBeenCalledTimes(1);
      const findArg = (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.where.id).toBe('cq-1');
      expect(findArg.relations).toContain('resultats');
      expect(result).toBeDefined();
      expect(result!.id).toBe('cq-1');
    });

    it('returns null when not found', async () => {
      (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws RpcException on DB error', async () => {
      (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('DB_ERROR'),
      );

      try {
        await service.findById('cq-1');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
      }
    });
  });

  // --- findByContratId ---

  describe('findByContratId', () => {
    it('finds by contratId ordered by dateSoumission DESC', async () => {
      const result = await service.findByContratId('contrat-1');

      const findArg = (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.where.contratId).toBe('contrat-1');
      expect(findArg.order.dateSoumission).toBe('DESC');
      expect(result).toBeDefined();
    });
  });

  // --- findByStatut ---

  describe('findByStatut', () => {
    it('returns paginated results', async () => {
      const result = await service.findByStatut('org-1', StatutCQ.EN_ATTENTE, 1, 20);

      expect(mocks.cqRepository.findAndCount).toHaveBeenCalledTimes(1);
      const findArg = (mocks.cqRepository.findAndCount as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.where.organisationId).toBe('org-1');
      expect(findArg.where.statut).toBe(StatutCQ.EN_ATTENTE);
      expect(findArg.skip).toBe(0);
      expect(findArg.take).toBe(20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('calculates correct skip for page 3', async () => {
      await service.findByStatut('org-1', StatutCQ.VALIDE, 3, 10);

      const findArg = (mocks.cqRepository.findAndCount as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.skip).toBe(20); // (3-1) * 10
      expect(findArg.take).toBe(10);
    });
  });

  // --- validerControle (VALIDE + event) ---

  describe('validerControle', () => {
    it('sets statut=VALIDE, score, validateurId, dateValidation, publishes NATS event', async () => {
      const result = await service.validerControle('cq-1', 'user-1', 95);

      // Saved with correct fields
      expect(mocks.cqRepository.save).toHaveBeenCalledTimes(1);
      const savedEntity = (mocks.cqRepository.save as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(savedEntity.statut).toBe(StatutCQ.VALIDE);
      expect(savedEntity.validateurId).toBe('user-1');
      expect(savedEntity.score).toBe(95);
      expect(savedEntity.dateValidation).toBeInstanceOf(Date);

      // NATS event published
      expect(mocks.natsService.publish).toHaveBeenCalledTimes(1);
      const publishArgs = (mocks.natsService.publish as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(publishArgs[0]).toBe('contrat.cq.validated');
      expect(publishArgs[1].contrat_id).toBe('contrat-1');
      expect(publishArgs[1].score).toBe(95);
      expect(publishArgs[1].validateur_id).toBe('user-1');

      expect(result).toBeDefined();
    });

    it('throws NOT_FOUND if controle does not exist', async () => {
      (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      try {
        await service.validerControle('nonexistent', 'user-1', 95);
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
      }
    });

    it('skips NATS publish when NATS not connected', async () => {
      (mocks.natsService.isConnected as ReturnType<typeof jest.fn>).mockReturnValue(false);

      const result = await service.validerControle('cq-1', 'user-1', 80);

      expect(mocks.natsService.publish).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('skips NATS publish when natsService is undefined', async () => {
      const serviceNoNats = new ControleQualiteService(
        mocks.cqRepository,
        mocks.statutRepository,
        undefined, // no NatsService
      );

      const result = await serviceNoNats.validerControle('cq-1', 'user-1', 80);

      expect(mocks.natsService.publish).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // --- rejeterControle (REJETE + motif required) ---

  describe('rejeterControle', () => {
    it('sets statut=REJETE, motifRejet, dateValidation, publishes NATS event', async () => {
      const result = await service.rejeterControle('cq-1', 'Documents incomplets');

      expect(mocks.cqRepository.save).toHaveBeenCalledTimes(1);
      const savedEntity = (mocks.cqRepository.save as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(savedEntity.statut).toBe(StatutCQ.REJETE);
      expect(savedEntity.motifRejet).toBe('Documents incomplets');
      expect(savedEntity.dateValidation).toBeInstanceOf(Date);

      // NATS event published
      expect(mocks.natsService.publish).toHaveBeenCalledTimes(1);
      const publishArgs = (mocks.natsService.publish as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(publishArgs[0]).toBe('contrat.cq.rejected');
      expect(publishArgs[1].contrat_id).toBe('contrat-1');
      expect(publishArgs[1].motif).toBe('Documents incomplets');

      expect(result).toBeDefined();
    });

    it('throws NOT_FOUND if controle does not exist', async () => {
      (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      try {
        await service.rejeterControle('nonexistent', 'Motif');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
      }
    });

    it('skips NATS publish when NATS not connected', async () => {
      (mocks.natsService.isConnected as ReturnType<typeof jest.fn>).mockReturnValue(false);

      await service.rejeterControle('cq-1', 'Motif');

      expect(mocks.natsService.publish).not.toHaveBeenCalled();
    });
  });

  // --- update ---

  describe('update', () => {
    it('updates and returns the updated entity', async () => {
      const result = await service.update('cq-1', { commentaire: 'Test comment' });

      expect(mocks.cqRepository.update).toHaveBeenCalledTimes(1);
      const updateArgs = (mocks.cqRepository.update as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(updateArgs[0]).toBe('cq-1');
      expect(updateArgs[1]).toEqual({ commentaire: 'Test comment' });
      expect(result).toBeDefined();
    });

    it('throws RpcException if entity not found after update', async () => {
      // First call for update succeeds, then findOne returns null
      (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      try {
        await service.update('cq-1', { commentaire: 'Test' });
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
      }
    });
  });

  // --- getStatutByCode ---

  describe('getStatutByCode', () => {
    it('returns statut entity by code', async () => {
      const result = await service.getStatutByCode('EN_ATTENTE');

      expect(mocks.statutRepository.findOne).toHaveBeenCalledTimes(1);
      const findArg = (mocks.statutRepository.findOne as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.where.code).toBe('EN_ATTENTE');
      expect(result).toBeDefined();
      expect(result!.code).toBe('EN_ATTENTE');
    });
  });

  // --- getAllStatuts ---

  describe('getAllStatuts', () => {
    it('returns all statuts ordered by ordreAffichage ASC', async () => {
      const result = await service.getAllStatuts();

      expect(mocks.statutRepository.find).toHaveBeenCalledTimes(1);
      const findArg = (mocks.statutRepository.find as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(findArg.order.ordreAffichage).toBe('ASC');
      expect(result).toHaveLength(3);
    });
  });

  // --- Full workflow: soumettreControle → validerControle ---

  describe('full workflow: create → valider', () => {
    it('EN_ATTENTE → VALIDE with NATS event', async () => {
      // Step 1: create returns EN_ATTENTE
      const created = await service.create('org-1', 'contrat-1');
      expect(created.statut).toBe(StatutCQ.EN_ATTENTE);

      // Step 2: valider → VALIDE
      const validated = await service.validerControle('cq-1', 'user-1', 100);
      expect(validated).toBeDefined();

      // NATS was called exactly once (only validerControle publishes)
      expect(mocks.natsService.publish).toHaveBeenCalledTimes(1);
      expect((mocks.natsService.publish as ReturnType<typeof jest.fn>).mock.calls[0][0]).toBe(
        'contrat.cq.validated',
      );
    });
  });

  // --- Full workflow: soumettreControle → rejeterControle ---

  describe('full workflow: create → rejeter', () => {
    it('EN_ATTENTE → REJETE with motif + NATS event', async () => {
      const created = await service.create('org-1', 'contrat-1');
      expect(created.statut).toBe(StatutCQ.EN_ATTENTE);

      const rejected = await service.rejeterControle('cq-1', 'Signature manquante');
      expect(rejected).toBeDefined();

      expect(mocks.natsService.publish).toHaveBeenCalledTimes(1);
      expect((mocks.natsService.publish as ReturnType<typeof jest.fn>).mock.calls[0][0]).toBe(
        'contrat.cq.rejected',
      );
    });
  });
});
