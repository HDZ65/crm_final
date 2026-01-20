import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClientBaseEntity } from './client-base.entity';

@Entity('gocardless_mandates')
@Index('idx_gocardless_mandate_client', ['clientId'])
@Index('idx_gocardless_mandate_id', ['mandateId'], { unique: true })
@Index('idx_gocardless_customer', ['gocardlessCustomerId'])
export class GoCardlessMandateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  gocardlessCustomerId: string;

  @Column({ nullable: true })
  gocardlessBankAccountId?: string;

  @Column({ unique: true })
  mandateId: string;

  @Column({ nullable: true })
  mandateReference?: string;

  @Column({ default: 'pending_submission' })
  mandateStatus: string;

  @Column({ default: 'sepa_core' })
  scheme: string;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  subscriptionStatus?: string;

  @Column({ type: 'timestamp', nullable: true })
  nextChargeDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, string>;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client?: ClientBaseEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
