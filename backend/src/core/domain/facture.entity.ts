import { BaseEntity } from './base.entity';

export interface FactureProps {
  id?: string;
  organisationId: string;
  numero: string;
  dateEmission: string;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string | null;
  clientPartenaireId: string;
  adresseFacturationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FactureEntity extends BaseEntity {
  organisationId: string;
  numero: string;
  dateEmission: string;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string | null;
  clientPartenaireId: string;
  adresseFacturationId: string;

  constructor(props: FactureProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.numero = props.numero;
    this.dateEmission = props.dateEmission;
    this.montantHT = props.montantHT;
    this.montantTTC = props.montantTTC;
    this.statutId = props.statutId;
    this.emissionFactureId = props.emissionFactureId;
    this.clientBaseId = props.clientBaseId;
    this.contratId = props.contratId ?? null;
    this.clientPartenaireId = props.clientPartenaireId;
    this.adresseFacturationId = props.adresseFacturationId;
  }

  // Add domain business logic methods here
}
