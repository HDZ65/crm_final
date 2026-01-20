import { BaseEntity } from './base.entity';

export interface SlimpayAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  appId: string;
  appSecret: string;
  creditorReference: string;
  environment: 'preprod' | 'production';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SlimpayAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  appId: string;
  appSecret: string;
  creditorReference: string;
  environment: 'preprod' | 'production';
  actif: boolean;

  constructor(props: SlimpayAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.appId = props.appId;
    this.appSecret = props.appSecret;
    this.creditorReference = props.creditorReference;
    this.environment = props.environment;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!(this.appId && this.appSecret && this.creditorReference);
  }

  isLiveMode(): boolean {
    return this.environment === 'production';
  }

  isPreprod(): boolean {
    return this.environment === 'preprod';
  }

  getApiBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://api.slimpay.com'
      : 'https://api.preprod.slimpay.com';
  }

  getOAuthTokenUrl(): string {
    return `${this.getApiBaseUrl()}/oauth/token`;
  }
}
