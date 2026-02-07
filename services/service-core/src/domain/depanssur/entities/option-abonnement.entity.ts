import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbonnementDepanssurEntity } from './abonnement-depanssur.entity';

@Entity('option_abonnement')
export class OptionAbonnementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abonnement_id', type: 'uuid' })
  abonnementId: string;

  @ManyToOne(() => AbonnementDepanssurEntity, (a) => a.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'abonnement_id' })
  abonnement: AbonnementDepanssurEntity;

  @Column({ length: 100 })
  type: string; // APPAREILS_ADDITIONNELS, DEPENDANCES, PRIORITE_24H

  @Column({ length: 255 })
  label: string;

  @Column({ name: 'prix_ttc', type: 'decimal', precision: 12, scale: 2 })
  prixTtc: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
