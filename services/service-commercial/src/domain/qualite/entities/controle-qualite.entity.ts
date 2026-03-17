import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { StatutCQ } from '../enums/statut-cq.enum';
import { ResultatCritereEntity } from './resultat-critere.entity';

@Entity('controles_qualite')
@Index(['organisationId'])
@Index(['contratId'])
@Index(['statut'])
export class ControleQualiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'varchar' })
  organisationId: string;

  @Column({ name: 'contrat_id', type: 'varchar' })
  contratId: string;

  @Column({ type: 'varchar', enum: StatutCQ, default: StatutCQ.EN_ATTENTE })
  statut: StatutCQ;

  @Column({ name: 'validateur_id', type: 'varchar', nullable: true })
  validateurId: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ name: 'date_soumission', type: 'timestamp', default: () => 'NOW()' })
  dateSoumission: Date;

  @Column({ name: 'date_validation', type: 'timestamp', nullable: true })
  dateValidation: Date | null;

  @Column({ name: 'motif_rejet', type: 'text', nullable: true })
  motifRejet: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ResultatCritereEntity, (resultat) => resultat.controleQualite)
  resultats: ResultatCritereEntity[];
}
