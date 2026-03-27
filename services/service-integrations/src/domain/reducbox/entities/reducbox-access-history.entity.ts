import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { ReducBoxAccessEntity } from './reducbox-access.entity';

@Entity('reducbox_access_history')
export class ReducBoxAccessHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'access_id', type: 'uuid' })
  accessId!: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 50 })
  previousStatus!: string;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus!: string;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason!: string | null;

  @Column({ name: 'changed_by', type: 'varchar', length: 255, nullable: true })
  changedBy!: string | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;

  @ManyToOne(() => ReducBoxAccessEntity, (access) => access.history)
  @JoinColumn({ name: 'access_id' })
  access!: Relation<ReducBoxAccessEntity>;
}
