import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { LigneBordereauEntity } from '../../ligne-bordereau/entities/ligne-bordereau.entity';

export enum StatutBordereau {
  BROUILLON = 'brouillon',
  VALIDE = 'valide',
  EXPORTE = 'exporte',
  ARCHIVE = 'archive',
}

@Entity('bordereaux_commission')
@Index(['organisationId', 'periode'])
@Index(['apporteurId', 'periode'])
export class BordereauCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 7 })
  periode: string; // YYYY-MM

  @Column({ name: 'apporteur_id', type: 'uuid' })
  @Index()
  apporteurId: string;

  @Column({ name: 'total_brut', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalBrut: number;

  @Column({ name: 'total_reprises', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalReprises: number;

  @Column({ name: 'total_acomptes', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAcomptes: number;

  @Column({ name: 'total_net_a_payer', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalNetAPayer: number;

  @Column({ name: 'nombre_lignes', type: 'int', default: 0 })
  nombreLignes: number;

  @Column({
    name: 'statut_bordereau',
    type: 'enum',
    enum: StatutBordereau,
    default: StatutBordereau.BROUILLON,
  })
  statutBordereau: StatutBordereau;

  @Column({ name: 'date_validation', type: 'timestamptz', nullable: true })
  dateValidation: Date | null;

  @Column({ name: 'validateur_id', type: 'uuid', nullable: true })
  validateurId: string | null;

  @Column({ name: 'date_export', type: 'timestamptz', nullable: true })
  dateExport: Date | null;

  @Column({ name: 'fichier_pdf_url', type: 'varchar', length: 500, nullable: true })
  fichierPdfUrl: string | null;

  @Column({ name: 'fichier_excel_url', type: 'varchar', length: 500, nullable: true })
  fichierExcelUrl: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @Column({ name: 'cree_par', type: 'varchar', length: 255, nullable: true })
  creePar: string | null;

  @OneToMany(() => LigneBordereauEntity, (ligne) => ligne.bordereau)
  lignes: LigneBordereauEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
