import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type {
  OrchestrationOperation,
  OrchestrationStatus,
} from '../../../core/domain/contract-orchestration-history.entity';

@Entity('contract_orchestration_histories')
export class ContractOrchestrationHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  contractId: string;

  @Column({ type: 'varchar' })
  operation: OrchestrationOperation;

  @Column({ type: 'varchar' })
  status: OrchestrationStatus;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
