import { BaseEntity } from './base.entity';

export interface PaypalAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  clientId: string;
  clientSecret: string;
  webhookId?: string | null;
  environment: 'sandbox' | 'live';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaypalAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  clientId: string;
  clientSecret: string;
  webhookId?: string | null;
  environment: 'sandbox' | 'live';
  actif: boolean;

  constructor(props: PaypalAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
    this.webhookId = props.webhookId ?? null;
    this.environment = props.environment;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  isLiveMode(): boolean {
    return this.environment === 'live';
  }

  isSandbox(): boolean {
    return this.environment === 'sandbox';
  }

  hasWebhookId(): boolean {
    return !!this.webhookId;
  }
}
