import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OAuthProvider } from './oauth-connection.entity';

export enum CalendarEventSource {
  CRM = 'crm',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK = 'outlook',
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
}

@Entity('calendar_events')
@Index(['userId', 'organisationId'])
@Index(['provider', 'externalId'], { unique: true })
@Index(['startTime', 'endTime'])
export class CalendarEventEntity {
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
    nullable: true,
  })
  provider: OAuthProvider;

  @Column({ name: 'external_id', type: 'varchar', length: 512, nullable: true })
  externalId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  attendees: any;

  @Column({ name: 'is_all_day', type: 'boolean', default: false })
  isAllDay: boolean;

  @Column({
    type: 'enum',
    enum: CalendarEventSource,
    default: CalendarEventSource.CRM,
  })
  source: CalendarEventSource;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ name: 'meeting_id', type: 'uuid', nullable: true })
  meetingId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
