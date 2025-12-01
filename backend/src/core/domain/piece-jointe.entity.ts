import { BaseEntity } from './base.entity';

export interface PieceJointeProps {
  id?: string;
  nomFichier: string;
  url: string;
  dateUpload: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PieceJointeEntity extends BaseEntity {
  nomFichier: string;
  url: string;
  dateUpload: string;

  constructor(props: PieceJointeProps) {
    super(props);
    this.nomFichier = props.nomFichier;
    this.url = props.url;
    this.dateUpload = props.dateUpload;
  }

  // Add domain business logic methods here
}
