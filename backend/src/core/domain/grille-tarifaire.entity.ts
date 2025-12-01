import { BaseEntity } from './base.entity';

export interface GrilleTarifaireProps {
  id?: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  estParDefaut: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GrilleTarifaireEntity extends BaseEntity {
  nom: string;
  dateDebut: string;
  dateFin: string;
  estParDefaut: boolean;

  constructor(props: GrilleTarifaireProps) {
    super(props);
    this.nom = props.nom;
    this.dateDebut = props.dateDebut;
    this.dateFin = props.dateFin;
    this.estParDefaut = props.estParDefaut;
  }

  // Add domain business logic methods here
}
