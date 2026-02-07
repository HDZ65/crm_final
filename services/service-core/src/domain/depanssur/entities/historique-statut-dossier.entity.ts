import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DossierDeclaratifEntity } from './dossier-declaratif.entity';

@Entity('historique_statut_dossier')
export class HistoriqueStatutDossierEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dossier_id', type: 'uuid' })
  dossierId: string;

  @Column({ name: 'ancien_statut', type: 'varchar', length: 100 })
  ancienStatut: string;

  @Column({ name: 'nouveau_statut', type: 'varchar', length: 100 })
  nouveauStatut: string;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => DossierDeclaratifEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dossier_id' })
  dossier: DossierDeclaratifEntity;
}
