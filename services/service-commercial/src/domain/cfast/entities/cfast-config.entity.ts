import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('cfast_configs')
export class CfastConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index({ unique: true })
  organisationId: string;

  @Column({ name: 'base_url', type: 'varchar', length: 500 })
  baseUrl: string;

  @Column({ name: 'client_id_encrypted', type: 'varchar', length: 500 })
  clientIdEncrypted: string;

  @Column({ name: 'client_secret_encrypted', type: 'varchar', length: 500 })
  clientSecretEncrypted: string;

  @Column({ name: 'username_encrypted', type: 'varchar', length: 500 })
  usernameEncrypted: string;

  @Column({ name: 'password_encrypted', type: 'varchar', length: 500 })
  passwordEncrypted: string;

  @Column({ name: 'scopes', type: 'varchar', length: 500, default: 'openid identity bill' })
  scopes: string;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError: string | null;

  @Column({ name: 'last_imported_count', type: 'int', default: 0 })
  lastImportedCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
