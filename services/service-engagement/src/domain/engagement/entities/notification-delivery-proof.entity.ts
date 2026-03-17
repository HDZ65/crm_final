import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum DeliveryChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  POSTAL = 'POSTAL',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

@Entity('notification_delivery_proof')
export class NotificationDeliveryProofEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notification_id', type: 'uuid', nullable: true })
  @Index()
  notificationId: string | null;

  @Column({
    type: 'enum',
    enum: DeliveryChannel,
  })
  @Index()
  channel: DeliveryChannel;

  @Column({
    name: 'delivery_status',
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  @Index()
  deliveryStatus: DeliveryStatus;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 500, nullable: true })
  providerMessageId: string | null;

  @Column({ name: 'provider_response', type: 'jsonb', nullable: true })
  providerResponse: Record<string, any> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
