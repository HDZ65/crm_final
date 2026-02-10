import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('provider_routing_rules')
@Index(['companyId', 'isEnabled', 'priority'])
export class ProviderRoutingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'int' })
  priority: number;

  @Column({ type: 'jsonb', default: '{}' })
  conditions: Record<string, any>;

  @Column({ name: 'provider_account_id', type: 'uuid' })
  providerAccountId: string;

  @Column({ default: false })
  fallback: boolean;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
