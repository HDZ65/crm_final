import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ScheduleEntity } from './schedule.entity';
import { OrganisationEntity } from './organisation.entity';
import { SocieteEntity } from './societe.entity';
import {
  PaymentIntentStatus,
  PSPName,
} from '../../../core/domain/payment.enums';

@Entity('payment_intents')
@Index(['idempotencyKey'], { unique: true })
@Index(['pspPaymentId'])
export class PaymentIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  scheduleId: string;

  @ManyToOne(() => ScheduleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheduleId' })
  schedule: ScheduleEntity;

  @Column({ type: 'varchar', nullable: true })
  societeId: string | null;

  @ManyToOne(() => SocieteEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column({
    type: 'enum',
    enum: PSPName,
  })
  pspName: PSPName;

  @Column({ type: 'varchar', nullable: true })
  pspPaymentId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.PENDING,
  })
  status: PaymentIntentStatus;

  @Column({ type: 'varchar', unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', nullable: true })
  mandateReference: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
