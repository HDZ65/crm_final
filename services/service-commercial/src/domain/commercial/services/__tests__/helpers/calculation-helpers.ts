// Note: We avoid importing entities directly to prevent circular dependencies in tests
// Instead, we create plain objects that match the entity structure

/**
 * Creates a mock BaremeCommissionEntity for testing
 * @param overrides - Partial overrides for the mock
 * @returns Mock BaremeCommissionEntity object
 */
export function createMockBareme(
  overrides?: Partial<{
    id: string;
    organisationId: string;
    code: string;
    nom: string;
    description: string | null;
    typeCalcul: string;
    baseCalcul: string;
    montantFixe: number | null;
    tauxPourcentage: number | null;
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
    paliers: any[];
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  return {
    id: overrides?.id ?? 'bareme-uuid-1',
    organisationId: overrides?.organisationId ?? 'org-uuid-1',
    code: overrides?.code ?? 'BAREME_TEST_001',
    nom: overrides?.nom ?? 'Barème Test',
    description: overrides?.description ?? 'Test barème for unit tests',
    typeCalcul: overrides?.typeCalcul ?? 'pourcentage',
    baseCalcul: overrides?.baseCalcul ?? 'cotisation_ht',
    montantFixe: overrides?.montantFixe ?? null,
    tauxPourcentage: overrides?.tauxPourcentage ?? 5.0,
    recurrenceActive: overrides?.recurrenceActive ?? false,
    tauxRecurrence: overrides?.tauxRecurrence ?? null,
    dureeRecurrenceMois: overrides?.dureeRecurrenceMois ?? null,
    dureeReprisesMois: overrides?.dureeReprisesMois ?? 3,
    tauxReprise: overrides?.tauxReprise ?? 100,
    typeProduit: overrides?.typeProduit ?? 'ASSURANCE',
    profilRemuneration: overrides?.profilRemuneration ?? 'VRP',
    societeId: overrides?.societeId ?? null,
    canalVente: overrides?.canalVente ?? null,
    repartitionCommercial: overrides?.repartitionCommercial ?? 100,
    repartitionManager: overrides?.repartitionManager ?? 0,
    repartitionAgence: overrides?.repartitionAgence ?? 0,
    repartitionEntreprise: overrides?.repartitionEntreprise ?? 0,
    version: overrides?.version ?? 1,
    dateEffet: overrides?.dateEffet ?? new Date('2025-01-01'),
    dateFin: overrides?.dateFin ?? null,
    actif: overrides?.actif ?? true,
    creePar: overrides?.creePar ?? 'test-user',
    modifiePar: overrides?.modifiePar ?? null,
    motifModification: overrides?.motifModification ?? null,
    paliers: overrides?.paliers ?? [],
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

/**
 * Creates a mock CommissionEntity for testing
 * @param overrides - Partial overrides for the mock
 * @returns Mock CommissionEntity object
 */
export function createMockCommission(
  overrides?: Partial<{
    id: string;
    organisationId: string;
    reference: string;
    apporteurId: string;
    contratId: string;
    produitId: string | null;
    compagnie: string;
    typeBase: string;
    montantBrut: number;
    montantReprises: number;
    montantAcomptes: number;
    montantNetAPayer: number;
    statutId: string;
    periode: string;
    dateCreation: Date;
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  return {
    id: overrides?.id ?? 'commission-uuid-1',
    organisationId: overrides?.organisationId ?? 'org-uuid-1',
    reference: overrides?.reference ?? 'COM-2025-001',
    apporteurId: overrides?.apporteurId ?? 'apporteur-uuid-1',
    contratId: overrides?.contratId ?? 'contrat-uuid-1',
    produitId: overrides?.produitId ?? 'produit-uuid-1',
    compagnie: overrides?.compagnie ?? 'Winvest Capital',
    typeBase: overrides?.typeBase ?? 'cotisation_ht',
    montantBrut: overrides?.montantBrut ?? 100.0,
    montantReprises: overrides?.montantReprises ?? 0,
    montantAcomptes: overrides?.montantAcomptes ?? 0,
    montantNetAPayer: overrides?.montantNetAPayer ?? 100.0,
    statutId: overrides?.statutId ?? 'statut-uuid-1',
    periode: overrides?.periode ?? '2025-01',
    dateCreation: overrides?.dateCreation ?? new Date('2025-01-15'),
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

/**
 * Creates a mock ContratEntity for testing
 * Note: This is a simplified mock since ContratEntity is in a different bounded context
 * @param overrides - Partial overrides for the mock
 * @returns Mock contract object
 */
export function createMockContrat(
  overrides?: Partial<{
    id: string;
    organisationId: string;
    reference: string;
    clientId: string;
    produitId: string;
    montantHT: number;
    dateSignature: Date;
    dateEffet: Date;
    dateFin: Date | null;
    statut: string;
  }>,
) {
  return {
    id: overrides?.id ?? 'contrat-uuid-1',
    organisationId: overrides?.organisationId ?? 'org-uuid-1',
    reference: overrides?.reference ?? 'CONTRAT-2025-001',
    clientId: overrides?.clientId ?? 'client-uuid-1',
    produitId: overrides?.produitId ?? 'produit-uuid-1',
    montantHT: overrides?.montantHT ?? 1000.0,
    dateSignature: overrides?.dateSignature ?? new Date('2025-01-01'),
    dateEffet: overrides?.dateEffet ?? new Date('2025-01-15'),
    dateFin: overrides?.dateFin ?? null,
    statut: overrides?.statut ?? 'VALIDE',
  };
}

/**
 * Creates a mock PalierCommissionEntity for testing
 * @param overrides - Partial overrides for the mock
 * @returns Mock PalierCommissionEntity object
 */
export function createMockPalier(
  overrides?: Partial<{
    id: string;
    organisationId: string;
    baremeId: string;
    code: string;
    nom: string;
    description: string | null;
    typePalier: string;
    seuilMin: number;
    seuilMax: number | null;
    montantPrime: number;
    tauxBonus: number | null;
    cumulable: boolean;
    parPeriode: boolean;
    typeProduit: string | null;
    ordre: number;
    actif: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  return {
    id: overrides?.id ?? 'palier-uuid-1',
    organisationId: overrides?.organisationId ?? 'org-uuid-1',
    baremeId: overrides?.baremeId ?? 'bareme-uuid-1',
    code: overrides?.code ?? 'PALIER_TEST_001',
    nom: overrides?.nom ?? 'Palier Test',
    description: overrides?.description ?? null,
    typePalier: overrides?.typePalier ?? 'volume',
    seuilMin: overrides?.seuilMin ?? 0,
    seuilMax: overrides?.seuilMax ?? 1000,
    montantPrime: overrides?.montantPrime ?? 50.0,
    tauxBonus: overrides?.tauxBonus ?? 0,
    cumulable: overrides?.cumulable ?? false,
    parPeriode: overrides?.parPeriode ?? true,
    typeProduit: overrides?.typeProduit ?? null,
    ordre: overrides?.ordre ?? 0,
    actif: overrides?.actif ?? true,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

/**
 * Rounds a number to 2 decimal places (banker's rounding)
 * @param value - The value to round
 * @returns Rounded value
 */
export function roundToTwoDec(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates percentage of a base amount
 * @param base - The base amount
 * @param percentage - The percentage to apply
 * @returns Calculated amount rounded to 2 decimals
 */
export function calculatePercentage(base: number, percentage: number): number {
  return roundToTwoDec((base * percentage) / 100);
}
