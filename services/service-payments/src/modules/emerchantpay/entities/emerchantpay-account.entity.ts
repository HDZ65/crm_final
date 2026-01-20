import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('emerchantpay_accounts')
export class EmerchantpayAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  societeId: string;

  @Column()
  nom: string;

  @Column({ nullable: true })
  apiLogin: string;

  @Column({ nullable: true })
  apiPassword: string;

  @Column({ nullable: true })
  terminalToken: string;

  @Column({ type: 'text', nullable: true })
  webhookPublicKey: string;

  @Column({ default: true })
  isSandbox: boolean;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  isConfigured(): boolean {
    return !!this.apiLogin && !!this.apiPassword && !!this.terminalToken;
  }

  isLiveMode(): boolean {
    return !this.isSandbox;
  }

  hasWebhookKey(): boolean {
    return !!this.webhookPublicKey;
  }
}
