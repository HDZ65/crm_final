import { BaseEntity } from './base.entity';

export interface MultisafepayAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  apiKey: string;
  siteId?: string | null;
  secureCode?: string | null;
  accountId?: string | null;
  environment: 'test' | 'live';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MultisafepayAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  apiKey: string;
  siteId?: string | null;
  secureCode?: string | null;
  accountId?: string | null;
  environment: 'test' | 'live';
  actif: boolean;

  constructor(props: MultisafepayAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.apiKey = props.apiKey;
    this.siteId = props.siteId ?? null;
    this.secureCode = props.secureCode ?? null;
    this.accountId = props.accountId ?? null;
    this.environment = props.environment;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  isLiveMode(): boolean {
    return this.environment === 'live';
  }

  isTestMode(): boolean {
    return this.environment === 'test';
  }

  getApiBaseUrl(): string {
    return this.environment === 'live'
      ? 'https://api.multisafepay.com/v1/json'
      : 'https://testapi.multisafepay.com/v1/json';
  }
}
