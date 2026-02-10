import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MatchType {
  EXACT_REF = 'EXACT_REF',
  AMOUNT_DATE = 'AMOUNT_DATE',
  CUSTOMER_REF = 'CUSTOMER_REF',
  MANUAL = 'MANUAL',
}

export enum ReconciliationStatus {
  AUTO_MATCHED = 'AUTO_MATCHED',
  MANUAL_MATCHED = 'MANUAL_MATCHED',
  TO_VERIFY = 'TO_VERIFY',
  UNMATCHED = 'UNMATCHED',
}

@Entity('reconciliations')
@Index(['status', 'createdAt'])
@Index(['paymentId'])
export class ReconciliationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @Column({ name: 'bank_ref', type: 'varchar', nullable: true })
  bankRef: string | null;

  @Column({ name: 'bank_amount_cents', type: 'int', nullable: true })
  bankAmountCents: number | null;

  @Column({ name: 'bank_date', type: 'date', nullable: true })
  bankDate: Date | null;

  @Column({
    name: 'match_type',
    type: 'enum',
    enum: MatchType,
  })
  matchType: MatchType;

  @Column({
    type: 'enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.UNMATCHED,
  })
  status: ReconciliationStatus;

  @Column({ name: 'reconciled_at', type: 'timestamptz', nullable: true })
  reconciledAt: Date | null;

  @Column({ name: 'reconciled_by', type: 'uuid', nullable: true })
  reconciledBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isMatched(): boolean {
    return (
      this.status === ReconciliationStatus.AUTO_MATCHED ||
      this.status === ReconciliationStatus.MANUAL_MATCHED
    );
  }

  needsVerification(): boolean {
    return this.status === ReconciliationStatus.TO_VERIFY;
  }
}
