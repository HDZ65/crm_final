import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WebhookEndpointStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('webhook_endpoints')
@Index(['partnerId', 'eventType'])
export class WebhookEndpointEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  @Index()
  partnerId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'allowed_ips', type: 'jsonb', nullable: true })
  allowedIps: string[] | null;

  @Column({ name: 'secret_encrypted', type: 'text' })
  secretEncrypted: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: WebhookEndpointStatus,
    default: WebhookEndpointStatus.ACTIVE,
  })
  status: WebhookEndpointStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

}
