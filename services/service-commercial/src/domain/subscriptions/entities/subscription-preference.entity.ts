import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SubscriptionPreferenceSchemaEntity } from './subscription-preference-schema.entity';
import { SubscriptionPreferenceHistoryEntity } from './subscription-preference-history.entity';

@Entity('subscription_preferences')
@Index(['organisationId', 'subscriptionId', 'schemaId'], { unique: true })
export class SubscriptionPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  @Index()
  subscriptionId: string;

  @Column({ name: 'schema_id', type: 'uuid' })
  schemaId: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamptz', nullable: true })
  effectiveTo: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => SubscriptionPreferenceSchemaEntity, (schema) => schema.preferences)
  @JoinColumn({ name: 'schema_id' })
  schema: SubscriptionPreferenceSchemaEntity;

  @OneToMany(() => SubscriptionPreferenceHistoryEntity, (history) => history.preference)
  history: SubscriptionPreferenceHistoryEntity[];
}
