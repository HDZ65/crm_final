import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('preference_snapshots')
export class PreferenceSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

   @Column({ name: 'organisation_id', type: 'uuid' })
   @Index()
   organisationId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  @Index()
  subscriptionId: string;

  @Column({ name: 'preference_data', type: 'jsonb' })
  preferenceData: Record<string, unknown>;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;
}
