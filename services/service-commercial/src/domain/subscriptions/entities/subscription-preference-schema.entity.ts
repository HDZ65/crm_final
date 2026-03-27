import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SubscriptionPreferenceEntity } from './subscription-preference.entity';

export enum PreferenceValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  ENUM = 'ENUM',
  BOOLEAN = 'BOOLEAN',
}

@Entity('subscription_preference_schemas')
@Index(['organisationId', 'code'], { unique: true })
export class SubscriptionPreferenceSchemaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 100 })
  code: string;

  @Column({ length: 255 })
  label: string;

  @Column({
    name: 'value_type',
    type: 'enum',
    enum: PreferenceValueType,
    default: PreferenceValueType.STRING,
  })
  valueType: PreferenceValueType;

  @Column({ name: 'allowed_values', type: 'jsonb', nullable: true })
  allowedValues: string[] | null;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'default_value', type: 'varchar', length: 500, nullable: true })
  defaultValue: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => SubscriptionPreferenceEntity, (pref) => pref.schema)
  preferences: SubscriptionPreferenceEntity[];
}
