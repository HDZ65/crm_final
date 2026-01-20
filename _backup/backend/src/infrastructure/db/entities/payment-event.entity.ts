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
import { PaymentIntentEntity } from './payment-intent.entity';
import { OrganisationEntity } from './organisation.entity';
import { PaymentEventType } from '../../../core/domain/payment.enums';

@Entity('payment_events')
@Index(['processed'])
@Index(['pspEventId'], { unique: true })
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pspEventId: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntentEntity;

  @Column({
    type: 'enum',
    enum: PaymentEventType,
  })
  eventType: PaymentEventType;

  @Column({ type: 'jsonb' })
  rawPayload: Record<string, any>;

  @Column({ type: 'timestamptz' })
  receivedAt: Date;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
