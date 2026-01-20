import { BaseEntity } from './base.entity';

export interface CommissionProps {
  id?: string;
  organisationId: string;
  reference: string;
  apporteurId: string;
  contratId: string;
  produitId?: string | null;
  compagnie: string;
  typeBase: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  statutId: string;
  periode: string;
  dateCreation: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CommissionEntity extends BaseEntity {
  organisationId: string;
  reference: string;
  apporteurId: string;
  contratId: string;
  produitId?: string | null;
  compagnie: string;
  typeBase: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  statutId: string;
  periode: string;
  dateCreation: Date;

  constructor(props: CommissionProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.reference = props.reference;
    this.apporteurId = props.apporteurId;
    this.contratId = props.contratId;
    this.produitId = props.produitId;
    this.compagnie = props.compagnie;
    this.typeBase = props.typeBase;
    this.montantBrut = props.montantBrut;
    this.montantReprises = props.montantReprises;
    this.montantAcomptes = props.montantAcomptes;
    this.montantNetAPayer = props.montantNetAPayer;
    this.statutId = props.statutId;
    this.periode = props.periode;
    this.dateCreation = props.dateCreation;
  }

  isForfait(): boolean {
    return this.typeBase === 'forfait';
  }

  isCotisationHT(): boolean {
    return this.typeBase === 'cotisation_ht';
  }

  isCAHT(): boolean {
    return this.typeBase === 'ca_ht';
  }

  isEnAttente(): boolean {
    return this.statutId === 'en_attente';
  }

  isValidee(): boolean {
    return this.statutId === 'validee';
  }

  isPayee(): boolean {
    return this.statutId === 'payee';
  }

  isContestee(): boolean {
    return this.statutId === 'contestee';
  }

  hasReprises(): boolean {
    return this.montantReprises !== 0;
  }

  hasAcomptes(): boolean {
    return this.montantAcomptes !== 0;
  }
}
