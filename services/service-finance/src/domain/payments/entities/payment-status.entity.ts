import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_statuses')
export class PaymentStatusEntity {
  @PrimaryColumn({ name: 'status_code' })
  statusCode: string;

  @Column()
  label: string;

  @Column({ name: 'is_final', default: false })
  isFinal: boolean;

  @Column({ name: 'can_retry', default: false })
  canRetry: boolean;

  @Column({ name: 'ui_badge_color', default: 'gray' })
  uiBadgeColor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isFinalStatus(): boolean {
    return this.isFinal;
  }

  canRetryPayment(): boolean {
    return this.canRetry && !this.isFinal;
  }
}
