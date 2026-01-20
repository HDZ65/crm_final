import { BaseEntity } from './base.entity';

export interface EmerchantpayAccountProps {
  id?: string;
  societeId: string;
  nom: string;
  username: string;
  password: string;
  terminalToken: string;
  environment: 'staging' | 'production';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EmerchantpayAccountEntity extends BaseEntity {
  societeId: string;
  nom: string;
  username: string;
  password: string;
  terminalToken: string;
  environment: 'staging' | 'production';
  actif: boolean;

  constructor(props: EmerchantpayAccountProps) {
    super(props);
    this.societeId = props.societeId;
    this.nom = props.nom;
    this.username = props.username;
    this.password = props.password;
    this.terminalToken = props.terminalToken;
    this.environment = props.environment;
    this.actif = props.actif;
  }

  isConfigured(): boolean {
    return !!(this.username && this.password && this.terminalToken);
  }

  isLiveMode(): boolean {
    return this.environment === 'production';
  }

  isStaging(): boolean {
    return this.environment === 'staging';
  }

  getApiBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://gate.emerchantpay.net'
      : 'https://staging.gate.emerchantpay.net';
  }
}
