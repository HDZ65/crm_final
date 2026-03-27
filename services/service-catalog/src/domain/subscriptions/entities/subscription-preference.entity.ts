import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPreferenceHistoryEntity } from './subscription-preference-history.entity';
import { SubscriptionPreferenceSchemaEntity } from './subscription-preference-schema.entity';

@Entity('subscription_preferences')
@Index(['keycloakGroupId', 'subscriptionId', 'schemaId'], { unique: true })
export class SubscriptionPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  @Index()
  keycloakGroupId: string;

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
  @ManyToOne(
    () => SubscriptionPreferenceSchemaEntity,
    (schema) => schema.preferences,
  )
  @JoinColumn({ name: 'schema_id' })
  schema: SubscriptionPreferenceSchemaEntity;

  @OneToMany(
    () => SubscriptionPreferenceHistoryEntity,
    (history) => history.preference,
  )
  history: SubscriptionPreferenceHistoryEntity[];
}
