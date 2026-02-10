import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OAuthProvider } from './oauth-connection.entity';

export enum MeetingSummaryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NO_TRANSCRIPT = 'no_transcript',
}

@Entity('meetings')
@Index(['userId', 'organisationId'])
@Index(['provider', 'externalMeetingId'], { unique: true })
@Index(['startTime', 'endTime'])
export class MeetingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({
    type: 'enum',
    enum: OAuthProvider,
  })
  provider: OAuthProvider;

  @Column({ name: 'external_meeting_id', type: 'varchar', length: 512, nullable: true })
  externalMeetingId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  participants: any;

  @Column({ name: 'recording_url', type: 'text', nullable: true })
  recordingUrl: string;

  @Column({ name: 'transcript_url', type: 'text', nullable: true })
  transcriptUrl: string;

  @Column({
    name: 'summary_status',
    type: 'enum',
    enum: MeetingSummaryStatus,
    default: MeetingSummaryStatus.PENDING,
  })
  summaryStatus: MeetingSummaryStatus;

  @Column({ name: 'calendar_event_id', type: 'uuid', nullable: true })
  calendarEventId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
