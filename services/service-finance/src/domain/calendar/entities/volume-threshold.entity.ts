import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('volume_threshold')
export class VolumeThresholdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string;

  @Column({ type: 'int', nullable: true })
  maxTransactionCount: number;

  @Column({ type: 'bigint', nullable: true })
  maxAmountCents: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ default: true })
  alertOnExceed: boolean;

  @Column({ length: 255, nullable: true })
  alertEmail: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
