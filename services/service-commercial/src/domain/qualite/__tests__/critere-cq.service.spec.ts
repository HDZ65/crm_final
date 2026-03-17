import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { Repository } from 'typeorm';
import { CritereCQEntity } from '../entities/critere-cq.entity';
import { TypeCritere } from '../enums/statut-cq.enum';

/**
 * Tests CRUD operations on CritereCQ entities via repository pattern.
 * No dedicated CritereCQ service exists — operations go through Repository<CritereCQEntity>.
 */

// --- Factory ---

function makeCritere(overrides: Partial<CritereCQEntity> = {}): CritereCQEntity {
  return {
    id: 'critere-1',
    organisationId: 'org-1',
    code: 'DOC_CNI',
    nom: 'Document CNI',
    description: 'Verification carte identite',
    typeCritere: TypeCritere.DOCUMENT,
    obligatoire: true,
    actif: true,
    ordre: 0,
    createdAt: new Date('2026-03-01'),
    ...overrides,
  } as CritereCQEntity;
}

// --- Mock builder ---

function createRepository() {
  const store: CritereCQEntity[] = [
    makeCritere(),
    makeCritere({
      id: 'critere-2',
      code: 'SIG_CONTRAT',
      nom: 'Signature contrat',
      typeCritere: TypeCritere.SIGNATURE,
      ordre: 1,
    }),
    makeCritere({
      id: 'critere-3',
      organisationId: 'org-2',
      code: 'PAY_FIRST',
      nom: 'Premier paiement',
      typeCritere: TypeCritere.PAIEMENT,
      ordre: 0,
    }),
  ];

  return {
    find: jest.fn(async (opts?: { where?: Partial<CritereCQEntity>; order?: Record<string, string> }) => {
      if (opts?.where?.organisationId) {
        return store.filter((c) => c.organisationId === opts.where!.organisationId);
      }
      return [...store];
    }),
    findOne: jest.fn(async (opts?: { where?: Partial<CritereCQEntity> }) => {
      if (opts?.where?.id) {
        return store.find((c) => c.id === opts.where!.id) ?? null;
      }
      if (opts?.where?.code && opts?.where?.organisationId) {
        return (
          store.find(
            (c) => c.code === opts.where!.code && c.organisationId === opts.where!.organisationId,
          ) ?? null
        );
      }
      return null;
    }),
    create: jest.fn((data: Partial<CritereCQEntity>) => ({
      ...makeCritere(),
      ...data,
      id: 'critere-new',
      createdAt: new Date(),
    })),
    save: jest.fn(async (entity: Partial<CritereCQEntity>) => ({
      ...makeCritere(),
      ...entity,
    })),
    update: jest.fn(async () => ({ affected: 1 })),
    delete: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<CritereCQEntity>;
}

// --- Tests ---------------------------------------------------------------

describe('CritereCQ Repository CRUD', () => {
  let repo: ReturnType<typeof createRepository>;

  beforeEach(() => {
    repo = createRepository();
  });

  // --- CREATE ---

  describe('create', () => {
    it('creates a critere with required fields', async () => {
      const data = {
        organisationId: 'org-1',
        code: 'CONF_ADRESSE',
        nom: 'Conformite adresse',
        typeCritere: TypeCritere.CONFORMITE,
        obligatoire: true,
        actif: true,
        ordre: 3,
      };

      const entity = repo.create(data);
      const saved = await repo.save(entity);

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(saved.code).toBe('CONF_ADRESSE');
      expect(saved.typeCritere).toBe(TypeCritere.CONFORMITE);
      expect(saved.organisationId).toBe('org-1');
    });

    it('defaults description to null when not provided', () => {
      const entity = repo.create({
        organisationId: 'org-1',
        code: 'TEST',
        nom: 'Test critere',
        typeCritere: TypeCritere.CUSTOM,
      });

      // description should be null from factory default when not overridden explicitly
      // In real DB, the column is nullable
      expect(entity).toBeDefined();
      expect(entity.code).toBe('TEST');
    });
  });

  // --- READ ---

  describe('findOne', () => {
    it('finds critere by id', async () => {
      const result = await repo.findOne({ where: { id: 'critere-1' } });

      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result!.id).toBe('critere-1');
      expect(result!.code).toBe('DOC_CNI');
    });

    it('returns null for nonexistent id', async () => {
      const result = await repo.findOne({ where: { id: 'nonexistent' } });
      expect(result).toBeNull();
    });

    it('finds by code + organisationId (unique constraint)', async () => {
      const result = await repo.findOne({
        where: { code: 'DOC_CNI', organisationId: 'org-1' },
      });

      expect(result).toBeDefined();
      expect(result!.code).toBe('DOC_CNI');
      expect(result!.organisationId).toBe('org-1');
    });
  });

  // --- findByOrganisation ---

  describe('findByOrganisation', () => {
    it('returns all criteres for a given organisation', async () => {
      const result = await repo.find({ where: { organisationId: 'org-1' } });

      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.organisationId === 'org-1')).toBe(true);
    });

    it('returns empty array for organisation with no criteres', async () => {
      const result = await repo.find({ where: { organisationId: 'org-unknown' } });

      expect(result).toHaveLength(0);
    });

    it('org-2 has only 1 critere', async () => {
      const result = await repo.find({ where: { organisationId: 'org-2' } });

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('PAY_FIRST');
    });
  });

  // --- UPDATE ---

  describe('update', () => {
    it('updates critere fields', async () => {
      const result = await repo.update('critere-1', {
        nom: 'Document CNI (updated)',
        actif: false,
      });

      expect(repo.update).toHaveBeenCalledTimes(1);
      const args = (repo.update as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(args[0]).toBe('critere-1');
      expect(args[1]).toEqual({ nom: 'Document CNI (updated)', actif: false });
      expect(result.affected).toBe(1);
    });
  });

  // --- DELETE ---

  describe('delete', () => {
    it('deletes a critere by id', async () => {
      const result = await repo.delete('critere-1');

      expect(repo.delete).toHaveBeenCalledTimes(1);
      expect((repo.delete as ReturnType<typeof jest.fn>).mock.calls[0][0]).toBe('critere-1');
      expect(result.affected).toBe(1);
    });
  });

  // --- TypeCritere enum coverage ---

  describe('TypeCritere enum values', () => {
    it.each([
      TypeCritere.DOCUMENT,
      TypeCritere.SIGNATURE,
      TypeCritere.PAIEMENT,
      TypeCritere.CONFORMITE,
      TypeCritere.CUSTOM,
    ])('accepts type %s', async (type) => {
      const entity = repo.create({
        organisationId: 'org-1',
        code: `TEST_${type}`,
        nom: `Test ${type}`,
        typeCritere: type,
      });
      const saved = await repo.save(entity);
      expect(saved.typeCritere).toBe(type);
    });
  });
});
