import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stripe_accounts')
export class StripeAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column()
  nom: string;

  @Column({ name: 'stripe_secret_key', nullable: true })
  stripeSecretKey: string;

  @Column({ name: 'stripe_publishable_key', nullable: true })
  stripePublishableKey: string;

  @Column({ name: 'stripe_webhook_secret', nullable: true })
  stripeWebhookSecret: string;

  @Column({ name: 'is_test_mode', default: true })
  isTestMode: boolean;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isConfigured(): boolean {
    return !!this.stripeSecretKey && !!this.stripePublishableKey;
  }

  isLiveMode(): boolean {
    return !this.isTestMode;
  }

  hasWebhookSecret(): boolean {
    return !!this.stripeWebhookSecret;
  }
}
