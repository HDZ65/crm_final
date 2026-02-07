import { describe, expect, it } from 'bun:test';
import { BordereauExportService } from '../bordereau-export.service';
import type { BordereauCommissionEntity } from '../../entities/bordereau-commission.entity';
import type { LigneBordereauEntity } from '../../entities/ligne-bordereau.entity';

function makeBordereau(): BordereauCommissionEntity {
  return {
    id: 'b-1',
    organisationId: 'org-1',
    reference: 'BRD-2026-01-0001',
    periode: '2026-01',
    apporteurId: 'app-1',
    totalBrut: 1200,
    totalReprises: 200,
    totalAcomptes: 0,
    totalNetAPayer: 1000,
    nombreLignes: 2,
    statutBordereau: 'valide' as any,
    dateValidation: new Date('2026-01-31T10:00:00.000Z'),
    validateurId: 'validator-1',
    dateExport: null,
    fichierPdfUrl: null,
    fichierExcelUrl: null,
    hashSha256: null,
    commentaire: null,
    creePar: null,
    lignes: [],
    createdAt: new Date('2026-01-31T10:00:00.000Z'),
    updatedAt: new Date('2026-01-31T10:00:00.000Z'),
  };
}

function makeLignes(): LigneBordereauEntity[] {
  return [
    {
      id: 'l-1',
      organisationId: 'org-1',
      bordereauId: 'b-1',
      bordereau: makeBordereau(),
      commissionId: 'c-1',
      repriseId: null,
      typeLigne: 'commission' as any,
      contratId: 'ct-1',
      contratReference: 'CTR-001',
      clientNom: 'Alice',
      produitNom: 'Produit A',
      montantBrut: 700,
      montantReprise: 100,
      montantNet: 600,
      baseCalcul: null,
      tauxApplique: null,
      baremeId: null,
      statutLigne: 'validee' as any,
      selectionne: true,
      motifDeselection: null,
      validateurId: null,
      dateValidation: null,
      ordre: 1,
      createdAt: new Date('2026-01-31T10:00:00.000Z'),
      updatedAt: new Date('2026-01-31T10:00:00.000Z'),
    },
    {
      id: 'l-2',
      organisationId: 'org-1',
      bordereauId: 'b-1',
      bordereau: makeBordereau(),
      commissionId: 'c-2',
      repriseId: null,
      typeLigne: 'commission' as any,
      contratId: 'ct-2',
      contratReference: 'CTR-002',
      clientNom: 'Bob',
      produitNom: 'Produit B',
      montantBrut: 500,
      montantReprise: 100,
      montantNet: 400,
      baseCalcul: null,
      tauxApplique: null,
      baremeId: null,
      statutLigne: 'validee' as any,
      selectionne: true,
      motifDeselection: null,
      validateurId: null,
      dateValidation: null,
      ordre: 2,
      createdAt: new Date('2026-01-31T10:00:00.000Z'),
      updatedAt: new Date('2026-01-31T10:00:00.000Z'),
    },
  ];
}

describe('BordereauExportService', () => {
  it('generates non-empty PDF buffer', async () => {
    const service = new BordereauExportService();
    const pdf = await service.genererPDF(makeBordereau(), makeLignes());

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(100);
  });

  it('generates Excel buffer', async () => {
    const service = new BordereauExportService();
    const xlsx = await service.genererExcel(makeBordereau(), makeLignes());

    expect(xlsx).toBeInstanceOf(Buffer);
    expect(xlsx.length).toBeGreaterThan(100);
  });

  it('returns deterministic SHA-256 hash', () => {
    const service = new BordereauExportService();
    const value = service.calculerHashSHA256(Buffer.from('abc'));

    expect(value).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
