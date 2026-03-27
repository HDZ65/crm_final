import { describe, expect, it } from 'bun:test';
import { Repository } from 'typeorm';
import { TypeTarification } from '../../enums/type-tarification.enum';
import { BundleTarificationStrategy } from '../tarification-strategies/bundle.strategy';
import { FixeTarificationStrategy } from '../tarification-strategies/fixe.strategy';
import { IndexeTarificationStrategy } from '../tarification-strategies/indexe.strategy';
import { NegocieTarificationStrategy } from '../tarification-strategies/negocie.strategy';
import { PalierTarificationStrategy } from '../tarification-strategies/palier.strategy';
import { RecurrentTarificationStrategy } from '../tarification-strategies/recurrent.strategy';
import { UsageTarificationStrategy } from '../tarification-strategies/usage.strategy';
import { TarificationService } from '../tarification.engine';

interface TestProduit {
  id: string;
  organisationId: string;
  prix: number;
  tauxTva: number;
  promotionActive: boolean;
  prixPromotion: number | null;
  dateDebutPromotion: Date | null;
  dateFinPromotion: Date | null;
  typeTarification: TypeTarification;
  configTarification: Record<string, unknown> | null;
}

interface TestFormule {
  id: string;
  produitId: string;
  code: string;
  prixFormule: number | null;
  actif: boolean;
}

interface TestPrixGrille {
  grilleTarifaireId: string;
  produitId: string;
  prixUnitaire: number;
  remisePourcent: number;
  prixMinimum: number | null;
  prixMaximum: number | null;
  actif: boolean;
}

function makeProduit(overrides: Partial<TestProduit> = {}): TestProduit {
  return {
    id: 'prod-1',
    organisationId: 'org-1',
    prix: 100,
    tauxTva: 20,
    promotionActive: false,
    prixPromotion: null,
    dateDebutPromotion: null,
    dateFinPromotion: null,
    typeTarification: TypeTarification.FIXE,
    configTarification: null,
    ...overrides,
  };
}

function makeFormule(overrides: Partial<TestFormule> = {}): TestFormule {
  return {
    id: 'formule-1',
    produitId: 'prod-1',
    code: 'PREMIUM',
    prixFormule: 55,
    actif: true,
    ...overrides,
  };
}

function makePrixGrille(overrides: Partial<TestPrixGrille> = {}): TestPrixGrille {
  return {
    grilleTarifaireId: 'grille-1',
    produitId: 'prod-1',
    prixUnitaire: 90,
    remisePourcent: 10,
    prixMinimum: null,
    prixMaximum: null,
    actif: true,
    ...overrides,
  };
}

function createEngineFixture(input: {
  produit?: TestProduit;
  formules?: TestFormule[];
  prixGrilles?: TestPrixGrille[];
} = {}): TarificationService {
  const produit = input.produit || makeProduit();
  const formules = input.formules || [];
  const prixGrilles = input.prixGrilles || [];

  const produitRepository = {
    findOne: async ({ where }: { where: { id: string } }) =>
      where.id === produit.id ? produit : null,
  } as unknown as Repository<any>;

  const prixProduitRepository = {
    findOne: async ({ where }: { where: { produitId: string; grilleTarifaireId: string; actif: boolean } }) =>
      prixGrilles.find(
        (prix) =>
          prix.produitId === where.produitId &&
          prix.grilleTarifaireId === where.grilleTarifaireId &&
          prix.actif === where.actif,
      ) || null,
  } as unknown as Repository<any>;

  const formuleProduitRepository = {
    findOne: async ({
      where,
    }: {
      where: { id?: string; produitId: string; code?: string; actif: boolean };
    }) =>
      formules.find((formule) => {
        if (!formule.actif || formule.produitId !== where.produitId) {
          return false;
        }

        if (where.id) {
          return formule.id === where.id;
        }

        if (where.code) {
          return formule.code === where.code;
        }

        return false;
      }) || null,
  } as unknown as Repository<any>;

  return new TarificationService(produitRepository, prixProduitRepository, formuleProduitRepository);
}

describe('Tarification strategies', () => {
  it('FIXE uses produit.prix as unit price', () => {
    const strategy = new FixeTarificationStrategy();
    const result = strategy.calculate(makeProduit({ prix: 120 }), 2);

    expect(result.prixUnitaire).toBe(120);
    expect(result.prixTotalHt).toBe(240);
  });

  it('PALIER picks tier by quantity', () => {
    const strategy = new PalierTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.PALIER,
        configTarification: {
          paliers: [
            { seuilMin: 1, seuilMax: 9, prix: 15 },
            { seuilMin: 10, seuilMax: 99, prix: 12 },
          ],
        },
      }),
      12,
    );

    expect(result.prixUnitaire).toBe(12);
    expect(result.prixTotalHt).toBe(144);
  });

  it('RECURRENT annual frequency multiplies monthly by 12', () => {
    const strategy = new RecurrentTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.RECURRENT,
        configTarification: {
          frequence: 'ANNUEL',
          prixMensuel: 30,
          dureeMinimale: 12,
        },
      }),
      1,
    );

    expect(result.prixUnitaire).toBe(360);
    expect(result.prixTotalHt).toBe(360);
  });

  it('USAGE applies monthly floor and ceiling', () => {
    const strategy = new UsageTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.USAGE,
        configTarification: {
          prixParUnite: 2,
          unitesMesure: 'GB',
          plancherMensuel: 10,
          plafondMensuel: 30,
        },
      }),
      2,
    );

    expect(result.prixTotalHt).toBe(10);
    expect(result.prixUnitaire).toBe(5);
  });

  it('BUNDLE applies bundle discount', () => {
    const strategy = new BundleTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.BUNDLE,
        configTarification: {
          produitIds: ['a', 'b'],
          prixBundle: 100,
          remisePourcent: 10,
        },
      }),
      2,
    );

    expect(result.prixUnitaire).toBe(90);
    expect(result.prixTotalHt).toBe(180);
  });

  it('NEGOCIE clamps negotiated price in allowed margin', () => {
    const strategy = new NegocieTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.NEGOCIE,
        configTarification: {
          prixBase: 100,
          margeNegociation: { min: 10, max: 15 },
        },
      }),
      1,
      {
        prixNegocie: 200,
      },
    );

    expect(result.prixUnitaire).toBe(115);
  });

  it('INDEXE applies current coefficient', () => {
    const strategy = new IndexeTarificationStrategy();
    const result = strategy.calculate(
      makeProduit({
        typeTarification: TypeTarification.INDEXE,
        configTarification: {
          prixBase: 80,
          indexReference: 'INSEE-ICT',
          coefficientActuel: 1.25,
          dateReference: '2026-01-01',
        },
      }),
      1,
    );

    expect(result.prixUnitaire).toBe(100);
  });
});

describe('TarificationService cascade', () => {
  it('Formule overrides grille, promotion and model', async () => {
    const produit = makeProduit({
      typeTarification: TypeTarification.FIXE,
      prix: 120,
      promotionActive: true,
      prixPromotion: 80,
    });
    const service = createEngineFixture({
      produit,
      formules: [makeFormule({ produitId: produit.id, code: 'PREMIUM', prixFormule: 55 })],
      prixGrilles: [makePrixGrille({ produitId: produit.id, grilleTarifaireId: 'grille-1', prixUnitaire: 90 })],
    });

    const result = await service.calculate(produit.id, 2, {
      formuleCode: 'PREMIUM',
      grilleTarifaireId: 'grille-1',
    });

    expect(result.sourceTarification).toBe('FORMULE');
    expect(result.prixUnitaire).toBe(55);
    expect(result.prixTotalHt).toBe(110);
  });

  it('Grille overrides promotion and model', async () => {
    const produit = makeProduit({
      typeTarification: TypeTarification.FIXE,
      prix: 120,
      promotionActive: true,
      prixPromotion: 80,
    });
    const service = createEngineFixture({
      produit,
      prixGrilles: [
        makePrixGrille({
          produitId: produit.id,
          grilleTarifaireId: 'grille-1',
          prixUnitaire: 90,
          remisePourcent: 10,
        }),
      ],
    });

    const result = await service.calculate(produit.id, 2, {
      grilleTarifaireId: 'grille-1',
    });

    expect(result.sourceTarification).toBe('GRILLE');
    expect(result.prixUnitaire).toBe(81);
    expect(result.prixTotalHt).toBe(162);
  });

  it('Promotion overrides model when no formule and no grille', async () => {
    const produit = makeProduit({
      typeTarification: TypeTarification.FIXE,
      prix: 120,
      promotionActive: true,
      prixPromotion: 75,
      dateDebutPromotion: new Date('2026-01-01T00:00:00.000Z'),
      dateFinPromotion: new Date('2026-12-31T23:59:59.000Z'),
    });
    const service = createEngineFixture({ produit });

    const result = await service.calculate(produit.id, 1, {
      dateEvaluation: new Date('2026-06-01T00:00:00.000Z'),
    });

    expect(result.sourceTarification).toBe('PROMOTION');
    expect(result.prixUnitaire).toBe(75);
    expect(result.promotionAppliquee).toBe(true);
  });

  it('Model fallback works with additional discount', async () => {
    const produit = makeProduit({
      typeTarification: TypeTarification.USAGE,
      configTarification: {
        prixParUnite: 3,
        unitesMesure: 'UNITE',
        plancherMensuel: 0,
        plafondMensuel: 100,
      },
      promotionActive: false,
    });
    const service = createEngineFixture({ produit });

    const result = await service.calculate(produit.id, 10, {
      remiseAdditionnelle: 10,
    });

    expect(result.sourceTarification).toBe('MODELE');
    expect(result.prixTotalHt).toBe(27);
  });
});
