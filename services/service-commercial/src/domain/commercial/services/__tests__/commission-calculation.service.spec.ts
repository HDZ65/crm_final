import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import {
  CommissionCalculationService,
  TypeCalcul,
  type BaremeForCalculation,
  type PalierForCalculation,
} from '../commission-calculation.service';

interface BaremeMock extends BaremeForCalculation {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;
  baseCalcul: string;
  recurrenceActive: boolean;
  tauxRecurrence: number | null;
  dureeRecurrenceMois: number | null;
  dureeReprisesMois: number;
  tauxReprise: number;
  typeProduit: string | null;
  profilRemuneration: string | null;
  societeId: string | null;
  canalVente: string | null;
  repartitionCommercial: number;
  repartitionManager: number;
  repartitionAgence: number;
  repartitionEntreprise: number;
  version: number;
  dateEffet: Date;
  dateFin: Date | null;
  actif: boolean;
  creePar: string | null;
  modifiePar: string | null;
  motifModification: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PalierMock extends PalierForCalculation {
  id: string;
  organisationId: string;
  baremeId: string;
  code: string;
  nom: string;
  description: string | null;
  typePalier: string;
  tauxBonus: number | null;
  parPeriode: boolean;
  typeProduit: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function makeBareme(overrides: Partial<BaremeMock> = {}): BaremeMock {
  return {
    id: 'bareme-1',
    organisationId: 'org-1',
    code: 'BRM-1',
    nom: 'Bareme test',
    description: null,
    typeCalcul: TypeCalcul.POURCENTAGE,
    baseCalcul: 'cotisation_ht',
    montantFixe: null,
    tauxPourcentage: 5,
    recurrenceActive: false,
    tauxRecurrence: null,
    dureeRecurrenceMois: null,
    dureeReprisesMois: 3,
    tauxReprise: 100,
    typeProduit: null,
    profilRemuneration: null,
    societeId: null,
    canalVente: null,
    repartitionCommercial: 100,
    repartitionManager: 0,
    repartitionAgence: 0,
    repartitionEntreprise: 0,
    version: 1,
    dateEffet: new Date('2026-01-01'),
    dateFin: null,
    actif: true,
    creePar: null,
    modifiePar: null,
    motifModification: null,
    paliers: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makePalier(overrides: Partial<PalierMock> = {}): PalierMock {
  return {
    id: 'palier-1',
    organisationId: 'org-1',
    baremeId: 'bareme-1',
    code: 'PAL-1',
    nom: 'Palier test',
    description: null,
    typePalier: 'ca',
    seuilMin: 0,
    seuilMax: null,
    montantPrime: 0,
    tauxBonus: null,
    cumulable: false,
    parPeriode: true,
    typeProduit: null,
    ordre: 1,
    actif: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('CommissionCalculationService', () => {
  const service = new CommissionCalculationService();

  it('calcul FIXE: bareme fixe retourne montantFixe', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.FIXE, montantFixe: 150.5, tauxPourcentage: null });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 1000);
    expect(result.montantCalcule).toBe(150.5);
  });

  it('calcul POURCENTAGE: montantBase x taux / 100', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.POURCENTAGE, tauxPourcentage: 12.5, montantFixe: null });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 800);
    expect(result.montantCalcule).toBe(100);
  });

  it('calcul PALIER: trouve le bon palier par seuils', () => {
    const bareme = makeBareme({
      typeCalcul: TypeCalcul.PALIER,
      paliers: [
        makePalier({ seuilMin: 0, seuilMax: 499.99, montantPrime: 25 }),
        makePalier({ id: 'palier-2', seuilMin: 500, seuilMax: 999.99, montantPrime: 80 }),
        makePalier({ id: 'palier-3', seuilMin: 1000, seuilMax: null, montantPrime: 150 }),
      ],
    });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 750);
    expect(result.montantCalcule).toBe(80);
  });

  it('calcul MIXTE: fixe + pourcentage combines', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.MIXTE, montantFixe: 50, tauxPourcentage: 5 });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 1000);
    expect(result.montantCalcule).toBe(100);
  });

  it('precision: arrondi au centime', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.POURCENTAGE, tauxPourcentage: 33.33, montantFixe: null });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 100.02);
    expect(result.montantCalcule).toBe(33.34);
  });

  it('edge: montantBase = 0 retourne 0', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.POURCENTAGE, tauxPourcentage: 10 });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 0);
    expect(result.montantCalcule).toBe(0);
  });

  it('edge: aucun bareme applicable throw DomainException', () => {
    expect(() => service.calculer({ id: 'contrat-1' }, null as unknown as BaremeForCalculation, 1000)).toThrow(
      DomainException,
    );
  });

  it('edge: montantBase negatif throw DomainException', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.POURCENTAGE, tauxPourcentage: 5 });
    expect(() => service.calculer({ id: 'contrat-1' }, bareme, -1)).toThrow(DomainException);
  });

  it('edge: taux = 0 retourne 0 sans erreur', () => {
    const bareme = makeBareme({ typeCalcul: TypeCalcul.POURCENTAGE, tauxPourcentage: 0, montantFixe: null });
    const result = service.calculer({ id: 'contrat-1' }, bareme, 1000);
    expect(result.montantCalcule).toBe(0);
  });

  it('palier cumulable: primes produits cumulables jusqu a 1000 EUR', () => {
    const bareme = makeBareme({
      typeCalcul: TypeCalcul.PALIER,
      paliers: [
        makePalier({ seuilMin: 0, seuilMax: 300, montantPrime: 100, cumulable: true, ordre: 1 }),
        makePalier({ id: 'palier-2', seuilMin: 301, seuilMax: 600, montantPrime: 250, cumulable: true, ordre: 2 }),
        makePalier({ id: 'palier-3', seuilMin: 601, seuilMax: 1000, montantPrime: 650, cumulable: true, ordre: 3 }),
      ],
    });
    expect(service.calculerPalier(bareme, 1000)).toBe(1000);
  });

  it('primes equipe par volume: 100=200, 200=500 ... 1000=2500', () => {
    const primes = service.verifierPrimesVolume('apporteur-1', '2026-02', [
      { seuil: 100, montantPrime: 200, volumeAtteint: 1000 },
      { seuil: 200, montantPrime: 500, volumeAtteint: 1000 },
      { seuil: 500, montantPrime: 1200, volumeAtteint: 1000 },
      { seuil: 800, montantPrime: 1800, volumeAtteint: 1000 },
      { seuil: 1000, montantPrime: 2500, volumeAtteint: 1000 },
    ]);

    expect(primes.length).toBe(5);
    expect(primes[4].montantPrime).toBe(2500);
    expect(primes.every((p) => p.applicable)).toBe(true);
  });
});
