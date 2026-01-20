import { BaseEntity } from './base.entity';

export interface ThemeMarqueProps {
  id?: string;
  logoUrl: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  faviconUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ThemeMarqueEntity extends BaseEntity {
  logoUrl: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  faviconUrl: string;

  constructor(props: ThemeMarqueProps) {
    super(props);
    this.logoUrl = props.logoUrl;
    this.couleurPrimaire = props.couleurPrimaire;
    this.couleurSecondaire = props.couleurSecondaire;
    this.faviconUrl = props.faviconUrl;
  }

  // Add domain business logic methods here
}
