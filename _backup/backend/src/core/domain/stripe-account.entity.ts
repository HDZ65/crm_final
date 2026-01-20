import { BaseEntity } from './base.entity';

export interface StripeAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret?: string | null;
  isTestMode: boolean;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StripeAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret?: string | null;
  isTestMode: boolean;
  actif: boolean;

  constructor(props: StripeAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.stripeSecretKey = props.stripeSecretKey;
    this.stripePublishableKey = props.stripePublishableKey;
    this.stripeWebhookSecret = props.stripeWebhookSecret ?? null;
    this.isTestMode = props.isTestMode;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!(this.stripeSecretKey && this.stripePublishableKey);
  }

  isLiveMode(): boolean {
    return !this.isTestMode;
  }

  hasWebhookSecret(): boolean {
    return !!this.stripeWebhookSecret;
  }
}
