import { BaseEntity } from './base.entity';

export type NotificationType =
  | 'CONTRAT_EXPIRE'
  | 'CONTRAT_BIENTOT_EXPIRE'
  | 'IMPAYE'
  | 'NOUVEAU_CLIENT'
  | 'NOUVEAU_CONTRAT'
  | 'TACHE_ASSIGNEE'
  | 'RAPPEL'
  | 'ALERTE'
  | 'INFO'
  | 'SYSTEME';

export interface NotificationProps {
  id?: string;
  organisationId: string;
  utilisateurId: string;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  metadata?: Record<string, any>;
  lienUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationEntity extends BaseEntity {
  organisationId: string;
  utilisateurId: string;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  metadata?: Record<string, any>;
  lienUrl?: string;

  constructor(props: NotificationProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.utilisateurId = props.utilisateurId;
    this.type = props.type;
    this.titre = props.titre;
    this.message = props.message;
    this.lu = props.lu ?? false;
    this.metadata = props.metadata;
    this.lienUrl = props.lienUrl;
  }

  marquerCommeLu(): void {
    this.lu = true;
    this.updatedAt = new Date();
  }
}
