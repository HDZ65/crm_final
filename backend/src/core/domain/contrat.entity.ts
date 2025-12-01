import { BaseEntity } from './base.entity';

export interface ContratProps {
  id?: string;
  organisationId: string;
  referenceExterne: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  statutId: string;
  autoRenouvellement: boolean;
  joursPreavis: number;
  conditionPaiementId: string;
  modeleDistributionId: string;
  facturationParId: string;
  clientBaseId: string;
  societeId: string;
  commercialId: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  dateFinRetractation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContratEntity extends BaseEntity {
  organisationId: string;
  referenceExterne: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  statutId: string;
  autoRenouvellement: boolean;
  joursPreavis: number;
  conditionPaiementId: string;
  modeleDistributionId: string;
  facturationParId: string;
  clientBaseId: string;
  societeId: string;
  commercialId: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  dateFinRetractation: string;

  constructor(props: ContratProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.referenceExterne = props.referenceExterne;
    this.dateSignature = props.dateSignature;
    this.dateDebut = props.dateDebut;
    this.dateFin = props.dateFin;
    this.statutId = props.statutId;
    this.autoRenouvellement = props.autoRenouvellement;
    this.joursPreavis = props.joursPreavis;
    this.conditionPaiementId = props.conditionPaiementId;
    this.modeleDistributionId = props.modeleDistributionId;
    this.facturationParId = props.facturationParId;
    this.clientBaseId = props.clientBaseId;
    this.societeId = props.societeId;
    this.commercialId = props.commercialId;
    this.clientPartenaireId = props.clientPartenaireId;
    this.adresseFacturationId = props.adresseFacturationId;
    this.dateFinRetractation = props.dateFinRetractation;
  }

  // Add domain business logic methods here
}
