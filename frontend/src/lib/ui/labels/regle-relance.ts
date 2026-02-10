/**
 * UI labels, types and constants for regles de relance
 */

import type { RegleRelance, HistoriqueRelance } from "@proto/relance/relance";

// Re-export proto types with DTO aliases for UI usage
export type RegleRelanceDto = RegleRelance;
export type HistoriqueRelanceDto = HistoriqueRelance;

export type RelanceDeclencheur =
  | 'IMPAYE'
  | 'CONTRAT_BIENTOT_EXPIRE'
  | 'CONTRAT_EXPIRE'
  | 'NOUVEAU_CLIENT'
  | 'INACTIVITE_CLIENT';

export type RelanceActionType =
  | 'CREER_TACHE'
  | 'ENVOYER_EMAIL'
  | 'NOTIFICATION'
  | 'TACHE_ET_EMAIL';

export const DECLENCHEUR_LABELS: Record<RelanceDeclencheur, string> = {
  IMPAYE: 'Impayé',
  CONTRAT_BIENTOT_EXPIRE: 'Contrat bientôt expiré',
  CONTRAT_EXPIRE: 'Contrat expiré',
  NOUVEAU_CLIENT: 'Nouveau client',
  INACTIVITE_CLIENT: 'Inactivité client',
};

export const ACTION_TYPE_LABELS: Record<RelanceActionType, string> = {
  CREER_TACHE: 'Créer une tâche',
  ENVOYER_EMAIL: 'Envoyer un email',
  NOTIFICATION: 'Notification',
  TACHE_ET_EMAIL: 'Tâche + Email',
};
