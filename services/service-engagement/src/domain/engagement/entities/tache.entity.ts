import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TacheType, TachePriorite, TacheStatut } from '@crm/shared-kernel';

// Re-export for convenience (consumers importing from entities still work)
export { TacheType, TachePriorite, TacheStatut };

@Entity('tache')
export class TacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TacheType,
    default: TacheType.AUTRE,
  })
  type: TacheType;

  @Column({
    type: 'enum',
    enum: TachePriorite,
    default: TachePriorite.MOYENNE,
  })
  priorite: TachePriorite;

  @Column({
    type: 'enum',
    enum: TacheStatut,
    default: TacheStatut.A_FAIRE,
  })
  statut: TacheStatut;

  @Column({ name: 'date_echeance', type: 'timestamp', nullable: true })
  dateEcheance: Date;

  @Column({ name: 'date_completion', type: 'timestamp', nullable: true })
  dateCompletion: Date;

  @Column({ name: 'assigne_a', nullable: true })
  assigneA: string;

  @Column({ name: 'cree_par', nullable: true })
  creePar: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  @Column({ name: 'contrat_id', nullable: true })
  contratId: string;

  @Column({ name: 'facture_id', nullable: true })
  factureId: string;

  @Column({ name: 'regle_relance_id', nullable: true })
  regleRelanceId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get enRetard(): boolean {
    if (!this.dateEcheance) return false;
    if (this.statut === TacheStatut.TERMINEE || this.statut === TacheStatut.ANNULEE) return false;
    return new Date() > this.dateEcheance;
  }
}
