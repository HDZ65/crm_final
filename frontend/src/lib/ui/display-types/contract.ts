/**
 * UI display types for contracts.
 * These types contain UI-specific fields (e.g. React.ElementType)
 * and are not direct proto re-exports.
 */

// Contrat simplifié pour les listes
export interface ContratSimpleDto {
  id: string;
  referenceExterne: string;
  dateDebut: string;
  dateFin: string;
  statutId: string;
  societeId?: string;
}

// Contrat pour l'affichage (mappé)
export interface Contract {
  ref: string;
  product: string;
  status: string;
  start: string;
  pay: string;
  jourPrelevement?: number;
  prochaineDatePrelevement?: string;
  sales: string;
  history: ContractEvent[];
}

// Événement de contrat
export interface ContractEvent {
  icon?: React.ElementType;
  label: string;
  date: string;
  ref?: string;
}
