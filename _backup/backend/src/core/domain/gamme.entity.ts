export interface GammeProps {
  id?: string;
  societeId: string;
  nom: string;
  description?: string;
  icone?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GammeEntity {
  public readonly id?: string;
  public readonly societeId: string;
  public readonly nom: string;
  public readonly description?: string;
  public readonly icone?: string;
  public readonly actif: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: GammeProps) {
    this.id = props.id;
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.description = props.description;
    this.icone = props.icone;
    this.actif = props.actif;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
