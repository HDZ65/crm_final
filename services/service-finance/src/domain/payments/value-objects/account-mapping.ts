export type AccountType = 'DEBIT' | 'CREDIT' | 'MIXTE';

export interface AccountMapping {
  numero_compte: string;
  libelle_compte: string;
  type: AccountType;
  journal_type?: string;
}

/** Plan Comptable Général standard (PCG) — mappings par défaut */
export const DEFAULT_ACCOUNT_MAPPINGS: AccountMapping[] = [
  { numero_compte: '411000', libelle_compte: 'Clients', type: 'DEBIT', journal_type: 'VENTES' },
  { numero_compte: '416000', libelle_compte: 'Clients douteux', type: 'DEBIT', journal_type: 'IMPAYES' },
  { numero_compte: '445710', libelle_compte: 'TVA collectée', type: 'CREDIT', journal_type: 'VENTES' },
  { numero_compte: '512000', libelle_compte: 'Banque', type: 'DEBIT', journal_type: 'REGLEMENTS' },
  { numero_compte: '706000', libelle_compte: 'Prestations de services', type: 'CREDIT', journal_type: 'VENTES' },
  { numero_compte: '706100', libelle_compte: 'Abonnements', type: 'CREDIT', journal_type: 'VENTES' },
  { numero_compte: '706200', libelle_compte: 'Commissions', type: 'CREDIT', journal_type: 'VENTES' },
  { numero_compte: '707000', libelle_compte: 'Ventes de marchandises', type: 'CREDIT', journal_type: 'VENTES' },
];
