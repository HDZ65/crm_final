import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  EXCHANGE = 'exchange',
  SMTP = 'smtp',
  OTHER = 'other',
}

export enum ConnectionType {
  OAUTH2 = 'oauth2',
  SMTP_IMAP = 'smtp_imap',
}

@Entity('mailboxes')
@Index(['organisationId', 'societeId'])
@Index(['userId'])
export class MailboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ name: 'adresse_email', type: 'varchar', length: 255 })
  adresseEmail: string;

  @Column({
    type: 'enum',
    enum: MailProvider,
    default: MailProvider.SMTP,
  })
  fournisseur: MailProvider;

  @Column({
    name: 'type_connexion',
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.SMTP_IMAP,
  })
  typeConnexion: ConnectionType;

  // SMTP Configuration
  @Column({ name: 'smtp_host', type: 'varchar', length: 255, nullable: true })
  smtpHost: string;

  @Column({ name: 'smtp_port', type: 'int', nullable: true })
  smtpPort: number;

  @Column({ name: 'smtp_secure', type: 'boolean', default: true })
  smtpSecure: boolean;

  // IMAP Configuration
  @Column({ name: 'imap_host', type: 'varchar', length: 255, nullable: true })
  imapHost: string;

  @Column({ name: 'imap_port', type: 'int', nullable: true })
  imapPort: number;

  @Column({ name: 'imap_secure', type: 'boolean', default: true })
  imapSecure: boolean;

  // Credentials (for SMTP/IMAP)
  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  password: string; // Encrypted

  // OAuth2 Tokens (encrypted)
  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @Column({ name: 'token_expiry', type: 'timestamptz', nullable: true })
  tokenExpiry: Date;

  @Column({ name: 'id_token', type: 'text', nullable: true })
  idToken: string;

  // Additional Settings
  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
