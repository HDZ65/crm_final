import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbonnementDepanssurEntity } from './abonnement-depanssur.entity';

@Entity('historique_statut_abonnement')
export class HistoriqueStatutAbonnementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'abonnement_id', type: 'uuid' })
  abonnementId: string;

  @ManyToOne(() => AbonnementDepanssurEntity, (a) => a.historique, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'abonnement_id' })
  abonnement: AbonnementDepanssurEntity;

  @Column({ name: 'ancien_statut', length: 50 })
  ancienStatut: string;

  @Column({ name: 'nouveau_statut', length: 50 })
  nouveauStatut: string;

  @Column({ length: 500, nullable: true })
  motif: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
