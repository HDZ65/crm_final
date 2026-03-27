import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fulfillment_cutoff_configs')
export class FulfillmentCutoffConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'societe_id', type: 'uuid' })
  @Index()
  societeId: string;

  @Column({ name: 'cutoff_day_of_week', type: 'int', default: 0 })
  cutoffDayOfWeek: number; // 0=Monday, 6=Sunday

  @Column({ name: 'cutoff_time', type: 'varchar', default: '12:00' })
  cutoffTime: string; // HH:mm format

  @Column({ type: 'varchar', default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isActive(): boolean {
    return this.active;
  }

  isValidDayOfWeek(): boolean {
    return this.cutoffDayOfWeek >= 0 && this.cutoffDayOfWeek <= 6;
  }

  isValidTimeFormat(): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(this.cutoffTime);
  }
}
