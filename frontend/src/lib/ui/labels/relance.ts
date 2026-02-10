/**
 * UI labels, string literal types, and display constants for relance module.
 * Proto types (RegleRelance, HistoriqueRelance, enums) come from @proto/relance/relance.
 */

import { RelanceDeclencheur, RelanceActionType, Priorite, RelanceResultat } from "@proto/relance/relance"

// String literal types for UI rendering (used in forms, filters, etc.)
export type RelanceDeclencheurType =
  | 'IMPAYE'
  | 'CONTRAT_BIENTOT_EXPIRE'
  | 'CONTRAT_EXPIRE'
  | 'NOUVEAU_CLIENT'
  | 'INACTIVITE_CLIENT';

export type RelanceActionTypeType =
  | 'CREER_TACHE'
  | 'ENVOYER_EMAIL'
  | 'NOTIFICATION'
  | 'TACHE_ET_EMAIL';

export type PrioriteTache = 'HAUTE' | 'MOYENNE' | 'BASSE';

export type ResultatRelance = 'SUCCES' | 'ECHEC' | 'IGNORE';

// Labels pour l'affichage
export const DECLENCHEUR_LABELS: Record<RelanceDeclencheurType, string> = {
  IMPAYE: 'Facture impayée',
  CONTRAT_BIENTOT_EXPIRE: 'Contrat bientôt expiré',
  CONTRAT_EXPIRE: 'Contrat expiré',
  NOUVEAU_CLIENT: 'Nouveau client',
  INACTIVITE_CLIENT: 'Client inactif',
};

export const ACTION_TYPE_LABELS: Record<RelanceActionTypeType, string> = {
  CREER_TACHE: 'Créer une tâche',
  ENVOYER_EMAIL: 'Envoyer un email',
  NOTIFICATION: 'Notification',
  TACHE_ET_EMAIL: 'Tâche + Email',
};

// Proto enum label records
export const DECLENCHEUR_PROTO_LABELS: Record<RelanceDeclencheur, string> = {
  [RelanceDeclencheur.DECLENCHEUR_UNSPECIFIED]: 'Non spécifié',
  [RelanceDeclencheur.IMPAYE]: 'Facture impayée',
  [RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE]: 'Contrat bientôt expiré',
  [RelanceDeclencheur.CONTRAT_EXPIRE]: 'Contrat expiré',
  [RelanceDeclencheur.NOUVEAU_CLIENT]: 'Nouveau client',
  [RelanceDeclencheur.INACTIVITE_CLIENT]: 'Client inactif',
  [RelanceDeclencheur.UNRECOGNIZED]: 'Non reconnu',
};

export const ACTION_TYPE_PROTO_LABELS: Record<RelanceActionType, string> = {
  [RelanceActionType.ACTION_TYPE_UNSPECIFIED]: 'Non spécifié',
  [RelanceActionType.CREER_TACHE]: 'Créer une tâche',
  [RelanceActionType.ENVOYER_EMAIL]: 'Envoyer un email',
  [RelanceActionType.NOTIFICATION]: 'Notification',
  [RelanceActionType.TACHE_ET_EMAIL]: 'Tâche + Email',
  [RelanceActionType.UNRECOGNIZED]: 'Non reconnu',
};

export const PRIORITE_PROTO_LABELS: Record<Priorite, string> = {
  [Priorite.PRIORITE_UNSPECIFIED]: 'Non spécifié',
  [Priorite.HAUTE]: 'Haute',
  [Priorite.MOYENNE]: 'Moyenne',
  [Priorite.BASSE]: 'Basse',
  [Priorite.UNRECOGNIZED]: 'Non reconnu',
};

export const RESULTAT_PROTO_LABELS: Record<RelanceResultat, string> = {
  [RelanceResultat.RESULTAT_UNSPECIFIED]: 'Non spécifié',
  [RelanceResultat.SUCCES]: 'Succès',
  [RelanceResultat.ECHEC]: 'Échec',
  [RelanceResultat.IGNORE]: 'Ignoré',
  [RelanceResultat.UNRECOGNIZED]: 'Non reconnu',
};
