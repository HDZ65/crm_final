import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AlertScope {
  PAYMENT = 'PAYMENT',
  PROVIDER = 'PROVIDER',
  SYSTEM = 'SYSTEM',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

@Entity('alerts')
@Index(['scope', 'severity', 'createdAt'])
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AlertScope,
  })
  scope: AlertScope;

  @Column({ name: 'scope_ref', type: 'varchar', nullable: true })
  scopeRef: string | null;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity: AlertSeverity;

  @Column()
  code: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'notified_channels', type: 'jsonb', default: '[]' })
  notifiedChannels: string[];

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string | null;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isAcknowledged(): boolean {
    return this.acknowledgedBy !== null;
  }

  acknowledge(userId: string): void {
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
  }
}
