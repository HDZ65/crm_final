import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('gocardless_accounts')
export class GoCardlessAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column()
  nom: string;

  @Column({ name: 'access_token', nullable: true })
  accessToken: string;

  @Column({ name: 'webhook_secret', nullable: true })
  webhookSecret: string;

  @Column({ name: 'is_sandbox', default: true })
  isSandbox: boolean;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isConfigured(): boolean {
    return !!this.accessToken;
  }

  isLiveMode(): boolean {
    return !this.isSandbox;
  }
}
