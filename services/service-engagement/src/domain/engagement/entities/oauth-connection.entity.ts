import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OAuthProvider {
  ZOOM = 'zoom',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export enum OAuthConnectionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  ERROR = 'error',
}

@Entity('oauth_connections')
@Index(['userId', 'provider'], { unique: true })
@Index(['organisationId'])
export class OAuthConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({
    type: 'enum',
    enum: OAuthProvider,
  })
  provider: OAuthProvider;

  @Column({ type: 'text', nullable: true })
  scopes: string;

  // Encrypted via EncryptionService (AES-256-GCM)
  @Column({ name: 'access_token_encrypted', type: 'text', nullable: true })
  accessTokenEncrypted: string;

  // Encrypted via EncryptionService (AES-256-GCM)
  @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
  refreshTokenEncrypted: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date;

  @Column({
    type: 'enum',
    enum: OAuthConnectionStatus,
    default: OAuthConnectionStatus.ACTIVE,
  })
  status: OAuthConnectionStatus;

  @Column({ name: 'connected_at', type: 'timestamptz', nullable: true })
  connectedAt: Date;

  @Column({ name: 'sync_token', type: 'text', nullable: true })
  syncToken: string;

  @Column({ name: 'channel_id', type: 'varchar', length: 255, nullable: true })
  channelId: string;

  @Column({ name: 'channel_expiration', type: 'timestamptz', nullable: true })
  channelExpiration: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
