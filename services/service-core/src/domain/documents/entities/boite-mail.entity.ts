import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Fournisseur {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  EXCHANGE = 'exchange',
  SMTP = 'smtp',
  OTHER = 'other',
}

export enum TypeConnexion {
  OAUTH2 = 'oauth2',
  SMTP_IMAP = 'smtp_imap',
}

@Entity('boites_mail')
export class BoiteMailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ name: 'adresse_email' })
  adresseEmail: string;

  @Column({
    type: 'enum',
    enum: Fournisseur,
    default: Fournisseur.SMTP,
  })
  fournisseur: Fournisseur;

  @Column({
    name: 'type_connexion',
    type: 'enum',
    enum: TypeConnexion,
    default: TypeConnexion.SMTP_IMAP,
  })
  typeConnexion: TypeConnexion;

  @Column({ name: 'serveur_smtp', type: 'varchar', nullable: true })
  serveurSMTP: string | null;

  @Column({ name: 'port_smtp', type: 'int', nullable: true })
  portSMTP: number | null;

  @Column({ name: 'serveur_imap', type: 'varchar', nullable: true })
  serveurIMAP: string | null;

  @Column({ name: 'port_imap', type: 'int', nullable: true })
  portIMAP: number | null;

  @Column({ name: 'utilise_ssl', default: false })
  utiliseSsl: boolean;

  @Column({ name: 'utilise_tls', default: false })
  utiliseTls: boolean;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ name: 'mot_de_passe', type: 'varchar', nullable: true })
  motDePasse: string | null;

  @Column({ name: 'client_id', type: 'varchar', nullable: true })
  clientId: string | null;

  @Column({ name: 'client_secret', type: 'varchar', nullable: true })
  clientSecret: string | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ name: 'token_expiration', type: 'timestamp', nullable: true })
  tokenExpiration: Date | null;

  @Column({ name: 'signature_html', type: 'text', nullable: true })
  signatureHtml: string | null;

  @Column({ name: 'signature_texte', type: 'text', nullable: true })
  signatureTexte: string | null;

  @Column({ name: 'est_par_defaut', default: false })
  estParDefaut: boolean;

  @Column({ default: true })
  actif: boolean;

  @Column({ name: 'utilisateur_id' })
  utilisateurId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  isOAuth2(): boolean {
    return this.typeConnexion === TypeConnexion.OAUTH2;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true;
    return new Date() > this.tokenExpiration;
  }
}
