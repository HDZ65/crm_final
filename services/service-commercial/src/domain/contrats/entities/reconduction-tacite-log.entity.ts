import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from './contrat.entity';

export enum ReconductionTaciteStatus {
  PENDING = 'PENDING',
  NOTIFIED_J90 = 'NOTIFIED_J90',
  NOTIFIED_J30 = 'NOTIFIED_J30',
  RENEWED = 'RENEWED',
  CANCELLED = 'CANCELLED',
}

@Entity('reconduction_tacite_log')
@Index(['contratId'])
@Index(['status'])
@Index(['renewalDate'])
export class ReconductionTaciteLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'renewal_date', type: 'timestamptz' })
  renewalDate: Date;

  @Column({ name: 'notification_j90_sent', type: 'boolean', default: false })
  notificationJ90Sent: boolean;

  @Column({ name: 'notification_j30_sent', type: 'boolean', default: false })
  notificationJ30Sent: boolean;

  @Column({ name: 'notification_j90_delivery_proof_id', type: 'uuid', nullable: true })
  notificationJ90DeliveryProofId: string | null;

  @Column({ name: 'notification_j30_delivery_proof_id', type: 'uuid', nullable: true })
  notificationJ30DeliveryProofId: string | null;

  @Column({ type: 'varchar', length: 60, default: ReconductionTaciteStatus.PENDING })
  status: ReconductionTaciteStatus;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ContratEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrat_id' })
  contrat: ContratEntity;
}
