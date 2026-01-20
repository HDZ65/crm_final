import { BaseEntity } from './base.entity';

export interface ClientBaseProps {
  id?: string;
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance?: Date | null;
  compteCode: string;
  partenaireId: string;
  telephone: string;
  email?: string;
  statut?: string;
  dateCreation: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientBaseEntity extends BaseEntity {
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance?: Date | null;
  compteCode: string;
  partenaireId: string;
  telephone: string;
  email?: string;
  statut: string;
  dateCreation: Date;

  constructor(props: ClientBaseProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.typeClient = props.typeClient;
    this.nom = props.nom;
    this.prenom = props.prenom;
    this.dateNaissance = props.dateNaissance;
    this.compteCode = props.compteCode;
    this.partenaireId = props.partenaireId;
    this.telephone = props.telephone;
    this.email = props.email;
    this.statut = props.statut ?? 'ACTIF';
    this.dateCreation = props.dateCreation;
  }

  // Add domain business logic methods here
}
