import { describe, expect, it } from 'bun:test';
import {
  BundlePriceRecalculatedPayload,
  ConsolidatedBillingService,
} from './consolidated-billing.service';

describe('ConsolidatedBillingService', () => {
  it('creates one consolidated facture with up to three service lines', async () => {
    let createInput: any;

    const factureService = {
      create: async (input: any) => {
        createInput = input;
        return { id: 'fac-1', ...input };
      },
      findById: async () => null,
    };

    const factureRepository = {
      findOne: async () => null,
      find: async () => [],
      save: async () => null,
    };

    const ligneRepository = {
      find: async () => [],
      save: async () => [],
    };

    const service = new ConsolidatedBillingService(
      factureService as any,
      factureRepository as any,
      ligneRepository as any,
    );

    const facture = await service.createRecurringConsolidatedFacture({
      organisationId: 'org-1',
      dateEmission: new Date('2026-02-01T00:00:00.000Z'),
      statutId: 'statut-brouillon',
      emissionFactureId: 'emission-standard',
      clientBaseId: 'client-1',
      clientPartenaireId: 'partenaire-1',
      adresseFacturationId: 'adresse-1',
      services: [
        {
          serviceCode: 'CONCIERGERIE',
          produitId: 'prod-conc',
          prixUnitaire: 5.9,
          prixCatalogueUnitaire: 9.9,
          description: 'Abonnement Conciergerie',
        },
        {
          serviceCode: 'JUSTI_PLUS',
          produitId: 'prod-justi',
          prixUnitaire: 5.9,
          prixCatalogueUnitaire: 9.9,
          description: 'Abonnement Justi+',
        },
        {
          serviceCode: 'WINCASH',
          produitId: 'prod-wincash',
          prixUnitaire: 5.9,
          prixCatalogueUnitaire: 9.9,
          description: 'Abonnement WinCash',
        },
      ],
    });

    expect(facture.id).toBe('fac-1');
    expect(createInput.lignes).toHaveLength(3);
    expect(createInput.lignes[0].metadata.serviceCode).toBe('CONCIERGERIE');
    expect(createInput.lignes[1].metadata.serviceCode).toBe('JUSTI_PLUS');
    expect(createInput.lignes[2].metadata.bundleDiscountApplied).toBe(true);
  });

  it('recalculates ligne prices when bundle.price.recalculated is received', async () => {
    const facture = {
      id: 'fac-draft',
      numero: null,
      montantHT: 9.9,
      montantTTC: 11.88,
      lignes: [
        {
          id: 'line-1',
          factureId: 'fac-draft',
          produitId: 'prod-justi',
          quantite: 1,
          prixUnitaire: 9.9,
          tauxTVA: 20,
          montantHT: 9.9,
          montantTVA: 1.98,
          montantTTC: 11.88,
          metadata: {
            serviceCode: 'JUSTI_PLUS',
            prixCatalogueUnitaire: 9.9,
            bundleDiscountApplied: false,
          },
        },
      ],
      estBrouillon: () => true,
    };

    const factureRepository = {
      findOne: async () => facture,
      find: async () => [],
      save: async (updated: any) => updated,
    };

    let savedLines: any[] = [];
    const ligneRepository = {
      find: async () => [],
      save: async (lines: any[]) => {
        savedLines = lines;
        return lines;
      },
    };

    const factureService = {
      create: async () => null,
      findById: async () => facture,
    };

    const service = new ConsolidatedBillingService(
      factureService as any,
      factureRepository as any,
      ligneRepository as any,
    );

    const payload: BundlePriceRecalculatedPayload = {
      factureId: 'fac-draft',
      services: [
        {
          produitId: 'prod-justi',
          serviceCode: 'JUSTI_PLUS',
          prixUnitaire: 5.9,
          prixCatalogueUnitaire: 9.9,
          tauxTVA: 20,
        },
      ],
    };

    await service.handleBundlePriceRecalculated(payload);

    expect(savedLines).toHaveLength(1);
    expect(savedLines[0].prixUnitaire).toBe(5.9);
    expect(savedLines[0].montantHT).toBe(5.9);
    expect(savedLines[0].montantTTC).toBe(7.08);
    expect(savedLines[0].metadata.bundleDiscountApplied).toBe(true);
    expect(facture.montantHT).toBe(5.9);
    expect(facture.montantTTC).toBe(7.08);
  });

  it('removes bundle discounts from non-conciergerie lines when conciergerie is unpaid', async () => {
    const facture = {
      id: 'fac-2',
      numero: null,
      montantHT: 11.8,
      montantTTC: 14.16,
      lignes: [
        {
          id: 'line-conc',
          factureId: 'fac-2',
          produitId: 'prod-conc',
          quantite: 1,
          prixUnitaire: 5.9,
          tauxTVA: 20,
          montantHT: 5.9,
          montantTVA: 1.18,
          montantTTC: 7.08,
          metadata: {
            serviceCode: 'CONCIERGERIE',
            prixCatalogueUnitaire: 9.9,
            bundleDiscountApplied: true,
          },
        },
        {
          id: 'line-justi',
          factureId: 'fac-2',
          produitId: 'prod-justi',
          quantite: 1,
          prixUnitaire: 5.9,
          tauxTVA: 20,
          montantHT: 5.9,
          montantTVA: 1.18,
          montantTTC: 7.08,
          metadata: {
            serviceCode: 'JUSTI_PLUS',
            prixCatalogueUnitaire: 9.9,
            bundleDiscountApplied: true,
          },
        },
      ],
      estBrouillon: () => true,
    };

    const factureRepository = {
      findOne: async () => null,
      find: async () => [facture],
      save: async (updated: any) => updated,
    };

    let savedLines: any[] = [];
    const ligneRepository = {
      find: async () => [],
      save: async (lines: any[]) => {
        savedLines = lines;
        return lines;
      },
    };

    const factureService = {
      create: async () => null,
      findById: async () => facture,
    };

    const service = new ConsolidatedBillingService(
      factureService as any,
      factureRepository as any,
      ligneRepository as any,
    );

    const result = await service.removeBundleDiscountsForClient({
      organisationId: 'org-1',
      clientBaseId: 'client-1',
    });

    expect(result.factureId).toBe('fac-2');
    expect(result.updatedLines).toBe(1);
    expect(savedLines[0].prixUnitaire).toBe(5.9);
    expect(savedLines[1].prixUnitaire).toBe(9.9);
    expect(savedLines[1].metadata.bundleDiscountApplied).toBe(false);
  });
});
