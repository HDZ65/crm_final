import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * DunningRunEntity persists the state of a dunning run for a failed payment.
 * Tracks the progression through dunning steps and resolution status.
 *
 * Maps to the DunningRunState interface in DunningDepanssurService.
 */
@Entity('dunning_runs')
@Index(['abonnementId'], { unique: true })
@Index(['organisationId'])
@Index(['isResolved'])
export class DunningRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  abonnementId: string;

  @Column({ type: 'uuid' })
  scheduleId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ type: 'uuid' })
  configId: string;

  @Column({ type: 'int', default: -1 })
  lastCompletedStep: number;

  @Column({ type: 'timestamptz' })
  failureDate: Date;

  @Column({ type: 'int', default: 0 })
  totalAttempts: number;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolutionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
