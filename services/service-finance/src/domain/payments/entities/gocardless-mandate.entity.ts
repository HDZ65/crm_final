import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MandateStatus {
  PENDING_CUSTOMER_APPROVAL = 'pending_customer_approval',
  PENDING_SUBMISSION = 'pending_submission',
  SUBMITTED = 'submitted',
  ACTIVE = 'active',
  SUSPENDED_BY_PAYER = 'suspended_by_payer',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  CONSUMED = 'consumed',
  BLOCKED = 'blocked',
}

/** Valid mandate status transitions (GoCardless SEPA lifecycle). */
const MANDATE_TRANSITIONS: Record<MandateStatus, MandateStatus[]> = {
  [MandateStatus.PENDING_CUSTOMER_APPROVAL]: [MandateStatus.PENDING_SUBMISSION, MandateStatus.CANCELLED],
  [MandateStatus.PENDING_SUBMISSION]: [MandateStatus.SUBMITTED, MandateStatus.FAILED, MandateStatus.CANCELLED],
  [MandateStatus.SUBMITTED]: [MandateStatus.ACTIVE, MandateStatus.FAILED, MandateStatus.CANCELLED],
  [MandateStatus.ACTIVE]: [MandateStatus.CANCELLED, MandateStatus.EXPIRED, MandateStatus.CONSUMED, MandateStatus.SUSPENDED_BY_PAYER],
  [MandateStatus.SUSPENDED_BY_PAYER]: [MandateStatus.ACTIVE, MandateStatus.CANCELLED],
  [MandateStatus.FAILED]: [],
  [MandateStatus.CANCELLED]: [],
  [MandateStatus.EXPIRED]: [],
  [MandateStatus.CONSUMED]: [],
  [MandateStatus.BLOCKED]: [],
};

/**
 * Check if a transition from one mandate status to another is valid.
 */
export function canTransitionMandate(from: MandateStatus, to: MandateStatus): boolean {
  return MANDATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns the list of terminal (no-exit) mandate statuses.
 */
export function isTerminalMandateStatus(status: MandateStatus): boolean {
  return MANDATE_TRANSITIONS[status]?.length === 0;
}

@Entity('gocardless_mandates')
export class GoCardlessMandateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column({ unique: true })
  mandateId: string;

  @Column({ unique: true, length: 35 })
  @Index()
  rum: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ name: 'customer_bank_account_id', nullable: true })
  customerBankAccountId: string;

  @Column({
    type: 'enum',
    enum: MandateStatus,
    default: MandateStatus.PENDING_CUSTOMER_APPROVAL,
  })
  status: MandateStatus;

  @Column({ nullable: true })
  scheme: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'account_holder_name', nullable: true })
  accountHolderName: string;

  @Column({ name: 'account_number_ending', nullable: true })
  accountNumberEnding: string;

  @Column({ name: 'next_possible_charge_date', nullable: true })
  nextPossibleChargeDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isActive(): boolean {
    return this.status === MandateStatus.ACTIVE;
  }

  canCharge(): boolean {
    return this.status === MandateStatus.ACTIVE;
  }

  /**
   * Check if this mandate can transition to the given status.
   */
  canTransitionTo(newStatus: MandateStatus): boolean {
    return canTransitionMandate(this.status, newStatus);
  }

  /**
   * Transition mandate to a new status. Throws if the transition is invalid.
   */
  transition(newStatus: MandateStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid mandate transition: ${this.status} → ${newStatus}`,
      );
    }
    this.status = newStatus;
  }

  /**
   * Whether this mandate is in a terminal (final) state.
   */
  isTerminal(): boolean {
    return isTerminalMandateStatus(this.status);
  }
}
