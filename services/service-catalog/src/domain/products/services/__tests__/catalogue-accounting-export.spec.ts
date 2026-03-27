/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests CdC §13 — Exports comptables Annexe F
 *
 * Exemples du CDC :
 *   - Action Prévoyance (SKU: AP-001) — COMMISSION 150,00 €
 *   - Mondial TV (SKU: MTV-002) — CA 89,99 € + TVA 20%
 *   - Depanssur (SKU: DEP-003) — REPRISE (clawback) -45,00 €
 */

import { AccountingNature } from '../../enums/accounting-nature.enum';
import { CatalogueAccountingExportService } from '../catalogue-accounting-export.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockRepo<_T> = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function makeLogRepo(): MockRepo<unknown> {
  const savedId = 'log-uuid-1';
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: unknown) => ({ ...(data as object), id: savedId })),
    save: jest.fn((data: unknown) => Promise.resolve({ ...(data as object), id: savedId })),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn(function (this: unknown) {
        return this;
      }),
      andWhere: jest.fn(function (this: unknown) {
        return this;
      }),
      orderBy: jest.fn(function (this: unknown) {
        return this;
      }),
      getMany: jest.fn(() => Promise.resolve([])),
    })),
  };
}

function makeAccountingMappingRepo(
  overrides?: Partial<Record<AccountingNature, { glAccount: string; journal: string; costCenter: string }>>,
): MockRepo<unknown> {
  return {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(({ where }: { where: { nature: AccountingNature } }) => {
      const mapping = overrides?.[where.nature];
      if (!mapping) return Promise.resolve(null);
      return Promise.resolve({
        glAccount: mapping.glAccount,
        journal: mapping.journal,
        costCenter: mapping.costCenter ?? '',
      });
    }),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    createQueryBuilder: jest.fn(() => ({})),
  };
}

function makeDataSource(rows: Record<string, unknown>[]): any {
  return {
    query: jest.fn(() => Promise.resolve(rows)),
  };
}

// ---------------------------------------------------------------------------
// CdC §13 test lines
// ---------------------------------------------------------------------------

/** Action Prévoyance — commission simple 150€ */
const lineActionPrevoyance = {
  type_ligne: 'COMMISSION',
  montant_brut: '150.00',
  montant_reprise: '0.00',
  montant_net: '150.00',
  taux_applique: '0',
  contrat_id: 'CTR-2025-001',
  contrat_reference: 'REF-001',
  client_nom: 'Dupont Jean',
  produit_nom: 'Action Prévoyance',
  sku: 'AP-001',
  partenaire_nom: 'GroupeVie',
  revenue_model: 'commission',
  produit_version_id: 'pv-001',
  societe_nom: 'Finanssor',
  periode: '2025-12',
  bordereau_date: new Date('2025-12-31'),
};

/** Mondial TV — CA + TVA 20% */
const lineMondialTv = {
  type_ligne: 'CA',
  montant_brut: '89.99',
  montant_reprise: '0.00',
  montant_net: '89.99',
  taux_applique: '20',
  contrat_id: 'CTR-2025-002',
  contrat_reference: 'REF-002',
  client_nom: 'Martin Sophie',
  produit_nom: 'Mondial TV',
  sku: 'MTV-002',
  partenaire_nom: null,
  revenue_model: 'revenue',
  produit_version_id: 'pv-002',
  societe_nom: 'Finanssor',
  periode: '2025-12',
  bordereau_date: new Date('2025-12-31'),
};

/** Depanssur — reprise (clawback) -45€ */
const lineDepanssur = {
  type_ligne: 'REPRISE',
  montant_brut: '45.00',
  montant_reprise: '45.00',
  montant_net: '-45.00',
  taux_applique: null,
  contrat_id: 'CTR-2025-003',
  contrat_reference: 'REF-003',
  client_nom: 'Bernard Paul',
  produit_nom: 'Depanssur',
  sku: 'DEP-003',
  partenaire_nom: 'Depanssur SA',
  revenue_model: 'commission',
  produit_version_id: 'pv-003',
  societe_nom: 'Finanssor',
  periode: '2025-12',
  bordereau_date: new Date('2025-12-31'),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CatalogueAccountingExportService — CdC §13', () => {
  let service: CatalogueAccountingExportService;

  function buildService(lines: Record<string, unknown>[]) {
    service = new CatalogueAccountingExportService(
      makeLogRepo() as any,
      makeAccountingMappingRepo() as any,
      makeDataSource(lines) as any,
    );
    // Mock storeFile to avoid fs writes in tests
    jest.spyOn(service as any, 'storeFile').mockResolvedValue(null);
  }

  // -------------------------------------------------------------------------
  // CSV format compliance
  // -------------------------------------------------------------------------

  describe('CSV — format CdC Annexe F', () => {
    it('doit démarrer par BOM UTF-8', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      expect(result.buffer[0]).toBe(0xef); // BOM byte 1
      expect(result.buffer[1]).toBe(0xbb); // BOM byte 2
      expect(result.buffer[2]).toBe(0xbf); // BOM byte 3
    });

    it('doit utiliser le séparateur ;', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const header = content.split('\r\n')[0]!;
      expect(header).toContain(';');
      const cols = header.split(';');
      expect(cols).toHaveLength(14);
    });

    it('doit utiliser la virgule comme séparateur décimal français', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const dataLine = content.split('\r\n')[1]!;
      // Crédit doit contenir une virgule (ex: 150,00)
      expect(dataLine).toMatch(/150,00/);
    });

    it('doit nommer le fichier EXPORT_{Société}_{YYYY-MM}.csv', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      expect(result.filename).toBe('EXPORT_Finanssor_2025-12.csv');
    });

    it('doit avoir exactement 14 colonnes dans le header', async () => {
      buildService([]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Test',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const header = content.split('\r\n')[0]!;
      expect(header.split(';')).toHaveLength(14);
    });
  });

  // -------------------------------------------------------------------------
  // Action Prévoyance — Commission simple
  // -------------------------------------------------------------------------

  describe('Action Prévoyance (AP-001) — Commission 150€', () => {
    it('doit générer 1 ligne de type Commission avec crédit 150,00', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      expect(result.rowCount).toBe(1);
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const row = content.split('\r\n')[1]!;
      const cols = row.split(';');
      expect(cols[4]).toBe('Commission'); // type_ecriture
      expect(cols[9]).toBe('150,00'); // crédit
      expect(cols[8]).toBe('0,00'); // débit
      expect(cols[12]).toBe('CTR-2025-001'); // reference_contrat
    });

    it('doit utiliser le compte GL par défaut 756000 pour Commission', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const row = content.split('\r\n')[1]!;
      const cols = row.split(';');
      expect(cols[5]).toBe('756000'); // compte_comptable
    });
  });

  // -------------------------------------------------------------------------
  // Mondial TV — CA + TVA
  // -------------------------------------------------------------------------

  describe('Mondial TV (MTV-002) — CA 89,99€ + TVA 20%', () => {
    it('doit générer 2 lignes (CA + TVA) pour revenue_model=revenue', async () => {
      buildService([lineMondialTv]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      // revenue model = 'revenue' → Commission row + CA row + TVA row
      expect(result.rowCount).toBeGreaterThanOrEqual(2);
    });

    it('doit avoir une ligne TVA non nulle avec taux 20%', async () => {
      buildService([lineMondialTv]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const lines = content.split('\r\n').slice(1).filter(Boolean);
      const tvaLine = lines.find((l) => l.split(';')[4] === 'TVA');
      expect(tvaLine).toBeDefined();
      expect(tvaLine?.split(';')[11]).toBe('20%');
    });
  });

  // -------------------------------------------------------------------------
  // Depanssur — Reprise (clawback)
  // -------------------------------------------------------------------------

  describe('Depanssur (DEP-003) — Reprise -45€', () => {
    it('doit générer une ligne Commission avec débit (non crédit) pour une reprise', async () => {
      buildService([lineDepanssur]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const row = content.split('\r\n')[1]!;
      const cols = row.split(';');
      expect(cols[4]).toBe('Commission');
      expect(cols[8]).toBe('45,00'); // débit (clawback)
      expect(cols[9]).toBe('0,00'); // crédit = 0
    });
  });

  // -------------------------------------------------------------------------
  // Intégrité — hash SHA-256
  // -------------------------------------------------------------------------

  describe('Intégrité SHA-256', () => {
    it('doit retourner un hash non vide de 64 caractères hex', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      expect(result.fileHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('doit retourner un logId après persistance', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        generated_by: 'TEST',
      });
      expect(result.logId).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Format XLSX
  // -------------------------------------------------------------------------

  describe('XLSX — fichier valide', () => {
    it('doit nommer le fichier EXPORT_{Société}_{YYYY-MM}.xlsx', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'xlsx',
        generated_by: 'TEST',
      });
      expect(result.filename).toBe('EXPORT_Finanssor_2025-12.xlsx');
    });

    it('doit retourner le mime type xlsx correct', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'xlsx',
        generated_by: 'TEST',
      });
      expect(result.mime).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('doit retourner un buffer non vide (signature PK zip)', async () => {
      buildService([lineActionPrevoyance]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'xlsx',
        generated_by: 'TEST',
      });
      // XLSX is a ZIP — starts with PK (0x50 0x4B)
      expect(result.buffer[0]).toBe(0x50);
      expect(result.buffer[1]).toBe(0x4b);
    });
  });

  // -------------------------------------------------------------------------
  // Filtrage par type d'écriture
  // -------------------------------------------------------------------------

  describe('Filtrage type_filter', () => {
    it('doit filtrer uniquement les lignes Commission', async () => {
      buildService([lineActionPrevoyance, lineMondialTv]);
      const result = await service.generateExport({
        keycloak_group_id: 'org-1',
        company_name: 'Finanssor',
        period: '2025-12',
        format: 'csv',
        type_filter: ['Commission'],
        generated_by: 'TEST',
      });
      const content = result.buffer.toString('utf-8').replace('\uFEFF', '');
      const lines = content.split('\r\n').slice(1).filter(Boolean);
      for (const line of lines) {
        expect(line.split(';')[4]).toBe('Commission');
      }
    });
  });
});
