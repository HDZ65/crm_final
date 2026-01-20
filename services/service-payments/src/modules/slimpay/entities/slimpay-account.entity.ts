import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('slimpay_accounts')
export class SlimpayAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  societeId: string;

  @Column()
  nom: string;

  @Column({ nullable: true })
  appName: string;

  @Column({ nullable: true })
  appSecret: string;

  @Column({ nullable: true })
  webhookSecret: string;

  @Column({ default: true })
  isSandbox: boolean;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  isConfigured(): boolean {
    return !!this.appName && !!this.appSecret;
  }

  isLiveMode(): boolean {
    return !this.isSandbox;
  }

  hasWebhookSecret(): boolean {
    return !!this.webhookSecret;
  }
}
