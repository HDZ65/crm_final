import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExpeditionEntity } from './expedition.entity';

export enum RetourExpeditionStatus {
  DEMANDE = 'DEMANDE',
  ETIQUETTE_GENEREE = 'ETIQUETTE_GENEREE',
  EN_TRANSIT = 'EN_TRANSIT',
  RECU = 'RECU',
}

@Entity('retour_expedition')
export class RetourExpeditionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expedition_id', type: 'uuid' })
  @Index()
  expeditionId: string;

  @ManyToOne(() => ExpeditionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expedition_id' })
  expedition: ExpeditionEntity;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: RetourExpeditionStatus.DEMANDE })
  @Index()
  status: RetourExpeditionStatus;

  @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'label_url', type: 'text', nullable: true })
  labelUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
