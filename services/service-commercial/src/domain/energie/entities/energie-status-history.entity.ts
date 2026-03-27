import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RaccordementEnergieEntity } from './raccordement-energie.entity';

@Entity('energie_status_history')
export class EnergieStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'raccordement_id', type: 'uuid' })
  raccordementId: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 60 })
  previousStatus: string;

  @Column({ name: 'new_status', type: 'varchar', length: 60 })
  newStatus: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  source: string | null;

  @Column({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;

  @ManyToOne('RaccordementEnergieEntity', 'statusHistory')
  @JoinColumn({ name: 'raccordement_id' })
  raccordement: RaccordementEnergieEntity;
}
