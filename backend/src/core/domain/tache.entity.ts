import { BaseEntity } from './base.entity';

export type TacheType =
  | 'APPEL'
  | 'EMAIL'
  | 'RDV'
  | 'RELANCE_IMPAYE'
  | 'RELANCE_CONTRAT'
  | 'RENOUVELLEMENT'
  | 'SUIVI'
  | 'AUTRE';

export type TachePriorite = 'HAUTE' | 'MOYENNE' | 'BASSE';

export type TacheStatut = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface TacheProps {
  id?: string;
  organisationId: string;
  titre: string;
  description?: string;
  type: TacheType;
  priorite: TachePriorite;
  statut: TacheStatut;
  dateEcheance: Date;
  dateCompletion?: Date;
  assigneA: string;
  creePar: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  regleRelanceId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TacheEntity extends BaseEntity {
  organisationId: string;
  titre: string;
  description?: string;
  type: TacheType;
  priorite: TachePriorite;
  statut: TacheStatut;
  dateEcheance: Date;
  dateCompletion?: Date;
  assigneA: string;
  creePar: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  regleRelanceId?: string;
  metadata?: Record<string, any>;

  constructor(props: TacheProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.titre = props.titre;
    this.description = props.description;
    this.type = props.type;
    this.priorite = props.priorite;
    this.statut = props.statut ?? 'A_FAIRE';
    this.dateEcheance = props.dateEcheance;
    this.dateCompletion = props.dateCompletion;
    this.assigneA = props.assigneA;
    this.creePar = props.creePar;
    this.clientId = props.clientId;
    this.contratId = props.contratId;
    this.factureId = props.factureId;
    this.regleRelanceId = props.regleRelanceId;
    this.metadata = props.metadata;
  }

  marquerEnCours(): void {
    this.statut = 'EN_COURS';
    this.updatedAt = new Date();
  }

  marquerTerminee(): void {
    this.statut = 'TERMINEE';
    this.dateCompletion = new Date();
    this.updatedAt = new Date();
  }

  marquerAnnulee(): void {
    this.statut = 'ANNULEE';
    this.updatedAt = new Date();
  }

  estEnRetard(): boolean {
    return this.statut !== 'TERMINEE' &&
           this.statut !== 'ANNULEE' &&
           new Date() > this.dateEcheance;
  }
}
