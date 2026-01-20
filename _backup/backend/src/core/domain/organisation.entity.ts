import { BaseEntity } from './base.entity';

export interface OrganisationProps {
  id?: string;
  nom: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrganisationEntity extends BaseEntity {
  nom: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif: boolean;

  constructor(props: OrganisationProps) {
    super(props);
    this.nom = props.nom;
    this.description = props.description;
    this.siret = props.siret;
    this.adresse = props.adresse;
    this.telephone = props.telephone;
    this.email = props.email;
    this.actif = props.actif;
  }
}
