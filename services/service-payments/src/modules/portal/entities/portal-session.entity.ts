import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PortalSessionStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  REDIRECTED = 'REDIRECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PortalSessionAction {
  VIEW_PAYMENT = 'VIEW_PAYMENT',
  PAY_BY_CARD = 'PAY_BY_CARD',
  PAY_BY_SEPA = 'PAY_BY_SEPA',
  SETUP_SEPA = 'SETUP_SEPA',
  VIEW_MANDATE = 'VIEW_MANDATE',
}

export enum PSPProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  GOCARDLESS = 'GOCARDLESS',
  EMERCHANTPAY = 'EMERCHANTPAY',
  SLIMPAY = 'SLIMPAY',
}

@Entity('portal_payment_session')
@Index('idx_portal_session_customer', ['customerId', 'status'])
@Index('idx_portal_session_expires', ['expiresAt'])
export class PortalPaymentSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organisationId: string;

  @Column()
  @Index()
  societeId: string;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  @Index('idx_portal_session_contract')
  contractId: string | null;

  @Column({ nullable: true })
  paymentIntentId: string | null;

  @Column({ unique: true, length: 64 })
  tokenHash: string;

  @Column({ length: 4, default: 'v1' })
  tokenVersion: string;

  @Column({
    type: 'enum',
    enum: PortalSessionStatus,
    default: PortalSessionStatus.CREATED,
  })
  status: PortalSessionStatus;

  @Column({ type: 'simple-array' })
  allowedActions: PortalSessionAction[];

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: 1 })
  maxUses: number;

  @Column({ default: 0 })
  useCount: number;

  @Column({ nullable: true, length: 64 })
  @Index('idx_portal_session_idempotency')
  idempotencyKeyHash: string | null;

  @Column({ type: 'bigint', default: 0 })
  amountCents: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ nullable: true, length: 500 })
  description: string | null;

  @Column({ nullable: true })
  mandateId: string | null;

  @Column({ nullable: true, length: 50 })
  rumMasked: string | null;

  @Column({ nullable: true, length: 64 })
  @Index('idx_portal_session_psp_state')
  pspState: string | null;

  @Column({ type: 'text', nullable: true })
  pspRedirectUrl: string | null;

  @Column({ type: 'enum', enum: PSPProvider, nullable: true })
  pspProvider: PSPProvider | null;

  @Column({ nullable: true, length: 255 })
  pspSessionId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isActive(): boolean {
    return this.status === PortalSessionStatus.ACTIVE && !this.isExpired();
  }

  canConsume(): boolean {
    return this.useCount < this.maxUses && !this.isExpired() && !this.consumedAt;
  }

  isTerminal(): boolean {
    return [
      PortalSessionStatus.COMPLETED,
      PortalSessionStatus.FAILED,
      PortalSessionStatus.EXPIRED,
      PortalSessionStatus.CANCELLED,
    ].includes(this.status);
  }

  canTransitionTo(newStatus: PortalSessionStatus): boolean {
    const allowedTransitions: Record<PortalSessionStatus, PortalSessionStatus[]> = {
      [PortalSessionStatus.CREATED]: [
        PortalSessionStatus.ACTIVE,
        PortalSessionStatus.EXPIRED,
        PortalSessionStatus.CANCELLED,
      ],
      [PortalSessionStatus.ACTIVE]: [
        PortalSessionStatus.REDIRECTED,
        PortalSessionStatus.EXPIRED,
        PortalSessionStatus.CANCELLED,
      ],
      [PortalSessionStatus.REDIRECTED]: [
        PortalSessionStatus.COMPLETED,
        PortalSessionStatus.FAILED,
        PortalSessionStatus.EXPIRED,
      ],
      [PortalSessionStatus.COMPLETED]: [],
      [PortalSessionStatus.FAILED]: [],
      [PortalSessionStatus.EXPIRED]: [],
      [PortalSessionStatus.CANCELLED]: [],
    };

    return allowedTransitions[this.status]?.includes(newStatus) ?? false;
  }

  hasAction(action: PortalSessionAction): boolean {
    return this.allowedActions.includes(action);
  }
}
