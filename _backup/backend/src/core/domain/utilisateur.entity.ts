import { BaseEntity } from './base.entity';

export interface UtilisateurProps {
  id?: string;
  keycloakId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UtilisateurEntity extends BaseEntity {
  keycloakId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  actif: boolean;

  constructor(props: UtilisateurProps) {
    super(props);
    this.keycloakId = props.keycloakId;
    this.nom = props.nom;
    this.prenom = props.prenom;
    this.email = props.email;
    this.telephone = props.telephone;
    this.actif = props.actif;
  }

  // Add domain business logic methods here
}
