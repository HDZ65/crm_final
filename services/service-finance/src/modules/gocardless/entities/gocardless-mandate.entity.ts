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
}
