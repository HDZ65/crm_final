import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RiskTier {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('risk_scores')
@Index(['riskTier', 'evaluatedAt'])
@Index(['paymentId'])
@Index(['contractId'])
export class RiskScoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid', unique: true })
  paymentId: string;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId: string | null;

  @Column({ type: 'int' })
  score: number;

  @Column({
    name: 'risk_tier',
    type: 'enum',
    enum: RiskTier,
  })
  riskTier: RiskTier;

  @Column({ type: 'jsonb', default: '{}' })
  factors: Record<string, any>;

  @Column({ name: 'evaluated_at' })
  evaluatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isHighRisk(): boolean {
    return this.riskTier === RiskTier.HIGH;
  }

  needsReview(): boolean {
    return this.score >= 70;
  }
}
