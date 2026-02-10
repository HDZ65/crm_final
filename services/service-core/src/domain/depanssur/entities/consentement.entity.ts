import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientBaseEntity } from '../../clients/entities/client-base.entity';

@Entity('consentements')
export class ConsentementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_base_id', type: 'uuid' })
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_base_id' })
  client: ClientBaseEntity;

  @Column({ length: 100 })
  type: string;

  @Column({ type: 'boolean', default: false })
  accorde: boolean;

  @Column({ name: 'date_accord', type: 'timestamptz', nullable: true })
  dateAccord: Date | null;

  @Column({ name: 'date_retrait', type: 'timestamptz', nullable: true })
  dateRetrait: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
