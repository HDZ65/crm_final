import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Represents the sequence of dunning steps for a given type.
 * Each step has a delay (in days from original failure), an action, and channels.
 */
export interface DunningStep {
  /** Day offset from J0 (original failure date) */
  delayDays: number;
  /** Action to perform at this step */
  action: 'RETRY_PAYMENT' | 'RETRY_PAYMENT_AND_NOTIFY' | 'SUSPEND';
  /** Notification channels for this step */
  channels: ('EMAIL' | 'SMS')[];
  /** Whether to create a PortalPaymentSession link */
  includePaymentLink: boolean;
  /** Template identifier for notification */
  templateId?: string;
  /** Human-readable label */
  label: string;
}

/**
 * DunningConfigEntity stores the configurable dunning sequence
 * for Depanssur subscription payment failures.
 *
 * Default sequence per CDC §6:
 *  - J0: Soft email + schedule retry J+2
 *  - J+2: 2nd automatic retry attempt
 *  - J+5: 3rd retry + SMS with payment update link
 *  - J+10: Suspend abonnement + cancel recurring commissions
 */
@Entity('dunning_config')
@Index(['organisationId', 'type', 'isActive'])
export class DunningConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ length: 50, default: 'DEPANSSUR' })
  type: string; // DEPANSSUR, CONCIERGERIE, etc.

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  /**
   * Ordered array of dunning steps.
   * Default value matches CDC §6: J0, J+2, J+5, J+10.
   */
  @Column({
    type: 'jsonb',
    default: JSON.stringify([
      {
        delayDays: 0,
        action: 'RETRY_PAYMENT',
        channels: ['EMAIL'],
        includePaymentLink: false,
        label: 'J0 - Soft email + schedule retry',
      },
      {
        delayDays: 2,
        action: 'RETRY_PAYMENT',
        channels: [],
        includePaymentLink: false,
        label: 'J+2 - 2nd automatic retry',
      },
      {
        delayDays: 5,
        action: 'RETRY_PAYMENT_AND_NOTIFY',
        channels: ['SMS'],
        includePaymentLink: true,
        label: 'J+5 - 3rd retry + SMS + payment link',
      },
      {
        delayDays: 10,
        action: 'SUSPEND',
        channels: ['EMAIL', 'SMS'],
        includePaymentLink: false,
        label: 'J+10 - Suspend abonnement + cancel commissions',
      },
    ] satisfies DunningStep[]),
  })
  steps: DunningStep[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;
}
