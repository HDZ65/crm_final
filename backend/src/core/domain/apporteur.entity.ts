import { BaseEntity } from './base.entity';

export interface ApporteurProps {
  id?: string;
  organisationId: string;
  utilisateurId?: string | null;
  nom: string;
  prenom: string;
  typeApporteur: string;
  email?: string | null;
  telephone?: string | null;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ApporteurEntity extends BaseEntity {
  organisationId: string;
  utilisateurId?: string | null;
  nom: string;
  prenom: string;
  typeApporteur: string;
  email?: string | null;
  telephone?: string | null;
  actif: boolean;

  constructor(props: ApporteurProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.utilisateurId = props.utilisateurId;
    this.nom = props.nom;
    this.prenom = props.prenom;
    this.typeApporteur = props.typeApporteur;
    this.email = props.email;
    this.telephone = props.telephone;
    this.actif = props.actif;
  }

  getNomComplet(): string {
    return `${this.prenom} ${this.nom}`;
  }

  isVRP(): boolean {
    return this.typeApporteur === 'VRP';
  }

  isManager(): boolean {
    return this.typeApporteur === 'Manager';
  }

  isDirecteur(): boolean {
    return this.typeApporteur === 'Directeur';
  }

  isPartenaire(): boolean {
    return this.typeApporteur === 'Partenaire';
  }
}
