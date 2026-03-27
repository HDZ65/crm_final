import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('call_summaries')
@Index(['meetingId'], { unique: true })
export class CallSummaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @Column({ name: 'executive_summary', type: 'text', nullable: true })
  executiveSummary: string;

  @Column({ name: 'key_points', type: 'jsonb', nullable: true })
  keyPoints: any;

  @Column({ type: 'jsonb', nullable: true })
  decisions: any;

  @Column({ name: 'action_items', type: 'jsonb', nullable: true })
  actionItems: any;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt: Date;

  @Column({ name: 'ai_model', type: 'varchar', length: 100, nullable: true })
  aiModel: string;

  @Column({ name: 'raw_ai_response', type: 'text', nullable: true })
  rawAiResponse: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
