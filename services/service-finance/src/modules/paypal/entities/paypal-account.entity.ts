import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('paypal_accounts')
export class PaypalAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column()
  nom: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  @Column({ name: 'client_secret', nullable: true })
  clientSecret: string;

  @Column({ name: 'webhook_id', nullable: true })
  webhookId: string;

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
    return !!this.clientId && !!this.clientSecret;
  }

  isLiveMode(): boolean {
    return !this.isSandbox;
  }
}
