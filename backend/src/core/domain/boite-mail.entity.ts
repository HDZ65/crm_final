import { BaseEntity } from './base.entity';

export interface BoiteMailProps {
  id?: string;
  nom: string;
  adresseEmail: string;
  fournisseur: string; // 'gmail', 'outlook', 'smtp', 'exchange', 'other'
  typeConnexion: string; // 'oauth2', 'smtp', 'imap'

  // Configuration SMTP/IMAP
  serveurSMTP?: string | null;
  portSMTP?: number | null;
  serveurIMAP?: string | null;
  portIMAP?: number | null;
  utiliseSsl?: boolean;
  utiliseTls?: boolean;

  // Credentials (devront être chiffrés en prod)
  username?: string | null;
  motDePasse?: string | null;

  // OAuth2 configuration
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  tokenExpiration?: Date | null;

  // Signature
  signatureHtml?: string | null;
  signatureTexte?: string | null;

  // Paramètres
  estParDefaut: boolean;
  actif: boolean;
  utilisateurId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export class BoiteMailEntity extends BaseEntity {
  nom: string;
  adresseEmail: string;
  fournisseur: string;
  typeConnexion: string;

  serveurSMTP?: string | null;
  portSMTP?: number | null;
  serveurIMAP?: string | null;
  portIMAP?: number | null;
  utiliseSsl?: boolean;
  utiliseTls?: boolean;

  username?: string | null;
  motDePasse?: string | null;

  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  tokenExpiration?: Date | null;

  signatureHtml?: string | null;
  signatureTexte?: string | null;

  estParDefaut: boolean;
  actif: boolean;
  utilisateurId: string;

  constructor(props: BoiteMailProps) {
    super(props);
    this.nom = props.nom;
    this.adresseEmail = props.adresseEmail;
    this.fournisseur = props.fournisseur;
    this.typeConnexion = props.typeConnexion;
    this.serveurSMTP = props.serveurSMTP;
    this.portSMTP = props.portSMTP;
    this.serveurIMAP = props.serveurIMAP;
    this.portIMAP = props.portIMAP;
    this.utiliseSsl = props.utiliseSsl;
    this.utiliseTls = props.utiliseTls;
    this.username = props.username;
    this.motDePasse = props.motDePasse;
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
    this.refreshToken = props.refreshToken;
    this.accessToken = props.accessToken;
    this.tokenExpiration = props.tokenExpiration;
    this.signatureHtml = props.signatureHtml;
    this.signatureTexte = props.signatureTexte;
    this.estParDefaut = props.estParDefaut;
    this.actif = props.actif;
    this.utilisateurId = props.utilisateurId;
  }

  // Méthodes métier
  isOAuth2(): boolean {
    return this.typeConnexion === 'oauth2';
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true;
    return new Date() > this.tokenExpiration;
  }

  isConfigured(): boolean {
    if (this.typeConnexion === 'oauth2') {
      return !!(this.clientId && this.refreshToken);
    }
    return !!(this.serveurSMTP && this.username && this.motDePasse);
  }
}
