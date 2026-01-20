import { BaseEntity } from './base.entity';

export interface ContratProps {
  id?: string;
  organisationId: string;
  reference: string;
  titre?: string | null;
  description?: string | null;
  type?: string | null;
  statut: string;
  dateDebut: string;
  dateFin?: string | null;
  dateSignature?: string | null;
  montant?: number | null;
  devise?: string | null;
  frequenceFacturation?: string | null;
  documentUrl?: string | null;
  fournisseur?: string | null;
  clientId: string;
  commercialId: string;
  societeId?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContratEntity extends BaseEntity {
  organisationId: string;
  reference: string;
  titre: string | null;
  description: string | null;
  type: string | null;
  statut: string;
  dateDebut: string;
  dateFin: string | null;
  dateSignature: string | null;
  montant: number | null;
  devise: string | null;
  frequenceFacturation: string | null;
  documentUrl: string | null;
  fournisseur: string | null;
  clientId: string;
  commercialId: string;
  notes: string | null;

  constructor(props: ContratProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.reference = props.reference;
    this.titre = props.titre ?? null;
    this.description = props.description ?? null;
    this.type = props.type ?? null;
    this.statut = props.statut;
    this.dateDebut = props.dateDebut;
    this.dateFin = props.dateFin ?? null;
    this.dateSignature = props.dateSignature ?? null;
    this.montant = props.montant ?? null;
    this.devise = props.devise ?? 'EUR';
    this.frequenceFacturation = props.frequenceFacturation ?? null;
    this.documentUrl = props.documentUrl ?? null;
    this.fournisseur = props.fournisseur ?? null;
    this.clientId = props.clientId;
    this.commercialId = props.commercialId;
    this.notes = props.notes ?? null;
  }
}
