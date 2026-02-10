import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum RetryAdvice {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  NEVER = 'NEVER',
}

@Entity('provider_status_mapping')
@Unique(['providerId', 'providerRawStatus'])
export class ProviderStatusMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ name: 'provider_raw_status' })
  providerRawStatus: string;

  @Column({ name: 'provider_raw_reason', type: 'varchar', nullable: true })
  providerRawReason: string | null;

  @Column({ name: 'status_code' })
  statusCode: string;

  @Column({
    name: 'retry_advice',
    type: 'enum',
    enum: RetryAdvice,
  })
  retryAdvice: RetryAdvice;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
