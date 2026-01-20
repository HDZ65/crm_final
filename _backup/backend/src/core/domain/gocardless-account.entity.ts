import { BaseEntity } from './base.entity';

export interface GoCardlessAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  accessToken: string;
  webhookSecret?: string | null;
  environment: 'sandbox' | 'live';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GoCardlessAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  accessToken: string;
  webhookSecret?: string | null;
  environment: 'sandbox' | 'live';
  actif: boolean;

  constructor(props: GoCardlessAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.accessToken = props.accessToken;
    this.webhookSecret = props.webhookSecret ?? null;
    this.environment = props.environment;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }

  isLiveMode(): boolean {
    return this.environment === 'live';
  }

  isSandbox(): boolean {
    return this.environment === 'sandbox';
  }

  hasWebhookSecret(): boolean {
    return !!this.webhookSecret;
  }
}
