import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('cutoff_configuration')
export class CutoffConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'time' })
  cutoffTime: string;

  @Column({ length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'int', default: 2 })
  daysBeforeValueDate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
