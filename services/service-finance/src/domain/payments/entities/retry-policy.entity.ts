import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RetryScheduleEntity } from './retry-schedule.entity';

@Entity('retry_policy')
@Index(['organisationId', 'isActive'])
@Index(['organisationId', 'societeId'])
export class RetryPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'uuid', nullable: true })
  channelId: string | null;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: '[5, 10, 20]' })
  retryDelaysDays: number[];

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'int', default: 30 })
  maxTotalDays: number;

  @Column({ type: 'boolean', default: true })
  retryOnAm04: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  retryableCodes: string[];

  @Column({ type: 'jsonb', default: '[]' })
  nonRetryableCodes: string[];

  @Column({ type: 'boolean', default: true })
  stopOnPaymentSettled: boolean;

  @Column({ type: 'boolean', default: true })
  stopOnContractCancelled: boolean;

  @Column({ type: 'boolean', default: true })
  stopOnMandateRevoked: boolean;

  @Column({ type: 'varchar', length: 20, default: 'FIXED' })
  backoffStrategy: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @OneToMany(() => RetryScheduleEntity, (schedule) => schedule.policy)
  schedules: RetryScheduleEntity[];
}
