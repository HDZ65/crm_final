import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutReport {
  EN_COURS = 'en_cours',
  APURE = 'apure',
  ANNULE = 'annule',
}

@Entity('reports_negatifs')
@Index(['organisationId', 'apporteurId', 'statutReport'])
@Index(['periodeOrigine'])
export class ReportNegatifEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  @Index()
  apporteurId: string;

  @Column({ name: 'periode_origine', type: 'varchar', length: 7 })
  periodeOrigine: string;

  @Column({ name: 'montant_initial', type: 'decimal', precision: 12, scale: 2 })
  montantInitial: number;

  @Column({ name: 'montant_restant', type: 'decimal', precision: 12, scale: 2 })
  montantRestant: number;

  @Column({
    name: 'statut_report',
    type: 'enum',
    enum: StatutReport,
    default: StatutReport.EN_COURS,
  })
  statutReport: StatutReport;

  @Column({ name: 'bordereau_origine_id', type: 'uuid', nullable: true })
  bordereauOrigineId: string | null;

  @Column({ name: 'derniere_periode_application', type: 'varchar', length: 7, nullable: true })
  dernierePeriodeApplication: string | null;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
