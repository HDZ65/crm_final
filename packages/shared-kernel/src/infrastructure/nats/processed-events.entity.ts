import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('processed_events')
@Index(['eventId'])
@Index(['expiresAt'])
export class ProcessedEvent {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  declare eventId: string;

  @Column({ type: 'varchar', length: 255 })
  declare eventType: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  declare processedAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  declare expiresAt: Date | null;
}
