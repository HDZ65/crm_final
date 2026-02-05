import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from '../../contrat/entities/contrat.entity';

@Entity('historique_statut_contrat')
export class HistoriqueStatutContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'ancien_statut_id', type: 'uuid' })
  ancienStatutId: string;

  @Column({ name: 'nouveau_statut_id', type: 'uuid' })
  nouveauStatutId: string;

  @Column({ name: 'date_changement', type: 'varchar', length: 50 })
  dateChangement: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ContratEntity, (contrat) => contrat.historique)
  @JoinColumn({ name: 'contrat_id' })
  contrat: ContratEntity;
}
