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

export interface RegleRelanceDto {
  id: string;
  organisationId: string;
  nom: string;
  description?: string;
  declencheur: RelanceDeclencheur;
  delaiJours: number;
  actionType: RelanceActionType;
  prioriteTache: 'HAUTE' | 'MOYENNE' | 'BASSE';
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  actif: boolean;
  ordre: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegleRelanceDto {
  organisationId: string;
  nom: string;
  description?: string;
  declencheur: RelanceDeclencheur;
  delaiJours: number;
  actionType: RelanceActionType;
  prioriteTache?: 'HAUTE' | 'MOYENNE' | 'BASSE';
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  actif?: boolean;
  ordre?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRegleRelanceDto {
  nom?: string;
  description?: string;
  declencheur?: RelanceDeclencheur;
  delaiJours?: number;
  actionType?: RelanceActionType;
  prioriteTache?: 'HAUTE' | 'MOYENNE' | 'BASSE';
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  actif?: boolean;
  ordre?: number;
  metadata?: Record<string, unknown>;
}

export interface HistoriqueRelanceDto {
  id: string;
  organisationId: string;
  regleRelanceId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  tacheCreeeId?: string;
  dateExecution: string;
  resultat: 'SUCCES' | 'ECHEC' | 'IGNORE';
  messageErreur?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Labels pour l'affichage
export const DECLENCHEUR_LABELS: Record<RelanceDeclencheur, string> = {
  IMPAYE: 'Facture impayée',
  CONTRAT_BIENTOT_EXPIRE: 'Contrat bientôt expiré',
  CONTRAT_EXPIRE: 'Contrat expiré',
  NOUVEAU_CLIENT: 'Nouveau client',
  INACTIVITE_CLIENT: 'Client inactif',
};

export const ACTION_TYPE_LABELS: Record<RelanceActionType, string> = {
  CREER_TACHE: 'Créer une tâche',
  ENVOYER_EMAIL: 'Envoyer un email',
  NOTIFICATION: 'Notification',
  TACHE_ET_EMAIL: 'Tâche + Email',
};
