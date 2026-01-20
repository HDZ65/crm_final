import { BaseEntity } from './base.entity';

export interface ColisProps {
  id?: string;
  expeditionId: string;
  poidsGr: number;
  longCm: number;
  largCm: number;
  hautCm: number;
  valeurDeclaree: number;
  contenu: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ColisEntity extends BaseEntity {
  expeditionId: string;
  poidsGr: number;
  longCm: number;
  largCm: number;
  hautCm: number;
  valeurDeclaree: number;
  contenu: string;

  constructor(props: ColisProps) {
    super(props);
    this.expeditionId = props.expeditionId;
    this.poidsGr = props.poidsGr;
    this.longCm = props.longCm;
    this.largCm = props.largCm;
    this.hautCm = props.hautCm;
    this.valeurDeclaree = props.valeurDeclaree;
    this.contenu = props.contenu;
  }

  // Add domain business logic methods here
}
