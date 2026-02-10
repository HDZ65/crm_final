import type { Apporteur } from "@proto/commerciaux/commerciaux";

// Type de commercial
export type TypeCommercial = 'vrp' | 'manager' | 'directeur' | 'partenaire';

// Labels pour affichage
export const TYPE_COMMERCIAL_LABELS: Record<TypeCommercial, string> = {
  vrp: 'VRP',
  manager: 'Manager',
  directeur: 'Directeur',
  partenaire: 'Partenaire',
};

/**
 * Filtres pour la recherche de commerciaux
 */
export interface CommercialFilters {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  typeApporteur?: TypeCommercial;
  actif?: boolean;
  organisationId?: string;
}

/**
 * Capitalise la première lettre de chaque mot
 */
function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper pour obtenir le nom complet d'un commercial
 * Capitalise automatiquement le nom et le prénom
 */
export function getCommercialFullName(commercial: Pick<Apporteur, 'nom' | 'prenom'>): string {
  const prenom = capitalizeWords(commercial.prenom);
  const nom = capitalizeWords(commercial.nom);
  return `${prenom} ${nom}`.trim();
}

/**
 * Helper pour obtenir le label du type de commercial
 */
export function getTypeCommercialLabel(type: TypeCommercial): string {
  return TYPE_COMMERCIAL_LABELS[type] || type;
}
