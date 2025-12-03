import { BaseEntity } from './base.entity';

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

export interface RegleRelanceProps {
  id?: string;
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
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RegleRelanceEntity extends BaseEntity {
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
  metadata?: Record<string, any>;

  constructor(props: RegleRelanceProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.nom = props.nom;
    this.description = props.description;
    this.declencheur = props.declencheur;
    this.delaiJours = props.delaiJours;
    this.actionType = props.actionType;
    this.prioriteTache = props.prioriteTache ?? 'MOYENNE';
    this.templateEmailId = props.templateEmailId;
    this.templateTitreTache = props.templateTitreTache;
    this.templateDescriptionTache = props.templateDescriptionTache;
    this.assigneParDefaut = props.assigneParDefaut;
    this.actif = props.actif ?? true;
    this.ordre = props.ordre ?? 1;
    this.metadata = props.metadata;
  }

  activer(): void {
    this.actif = true;
    this.updatedAt = new Date();
  }

  desactiver(): void {
    this.actif = false;
    this.updatedAt = new Date();
  }
}
