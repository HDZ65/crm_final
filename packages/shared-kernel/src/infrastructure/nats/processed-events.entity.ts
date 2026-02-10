import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('processed_events')
@Index(['eventId'])
@Index(['expiresAt'])
export class ProcessedEvent {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  eventId: string;

  @Column({ type: 'varchar', length: 255 })
  eventType: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt: Date | null;
}
