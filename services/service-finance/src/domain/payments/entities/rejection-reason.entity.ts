import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RejectionCategory {
  INSUFFISANCE = 'INSUFFISANCE',
  TECHNIQUE = 'TECHNIQUE',
  CONTESTATION = 'CONTESTATION',
  AUTRE = 'AUTRE',
}

@Entity('rejection_reasons')
@Index(['providerName', 'providerCode'])
export class RejectionReasonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_name' })
  providerName: string;

  @Column({ name: 'provider_code' })
  providerCode: string;

  @Column({ name: 'label_fr' })
  labelFr: string;

  @Column({
    type: 'enum',
    enum: RejectionCategory,
  })
  category: RejectionCategory;

  @Column({ name: 'is_retryable', default: false })
  isRetryable: boolean;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
