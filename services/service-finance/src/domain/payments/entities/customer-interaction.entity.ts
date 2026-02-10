import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InteractionChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  CALL = 'CALL',
}

export enum InteractionStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  QUEUED = 'QUEUED',
}

@Entity('customer_interactions')
@Index(['customerId', 'sentAt'])
@Index(['paymentId'])
export class CustomerInteractionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({
    type: 'enum',
    enum: InteractionChannel,
  })
  channel: InteractionChannel;

  @Column({ name: 'message_type' })
  messageType: string;

  @Column({ type: 'jsonb', default: '{}' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: InteractionStatus,
    default: InteractionStatus.QUEUED,
  })
  status: InteractionStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isSent(): boolean {
    return this.status === InteractionStatus.SENT;
  }

  hasFailed(): boolean {
    return this.status === InteractionStatus.FAILED;
  }
}
