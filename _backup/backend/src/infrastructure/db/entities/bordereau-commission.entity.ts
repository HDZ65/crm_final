import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LigneBordereauEntity } from './ligne-bordereau.entity';
import { ApporteurEntity } from './apporteur.entity';

@Entity('bordereaux_commission')
export class BordereauCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ length: 100, unique: true })
  reference: string;

  @Column({ length: 7 })
  periode: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  apporteurId: string;

  @Column({
    name: 'total_brut',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalBrut: number;

  @Column({
    name: 'total_reprises',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalReprises: number;

  @Column({
    name: 'total_acomptes',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAcomptes: number;

  @Column({
    name: 'total_net_a_payer',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalNetAPayer: number;

  @Column({ name: 'nombre_lignes', type: 'int', default: 0 })
  nombreLignes: number;

  @Column({
    name: 'statut_bordereau',
    type: 'varchar',
    length: 20,
    default: 'brouillon',
  })
  statutBordereau: string;

  @Column({ name: 'date_validation', type: 'timestamp', nullable: true })
  dateValidation: Date | null;

  @Column({ name: 'validateur_id', type: 'varchar', nullable: true })
  validateurId: string | null;

  @Column({ name: 'date_export', type: 'timestamp', nullable: true })
  dateExport: Date | null;

  @Column({ name: 'fichier_pdf_url', type: 'varchar', nullable: true })
  fichierPdfUrl: string | null;

  @Column({ name: 'fichier_excel_url', type: 'varchar', nullable: true })
  fichierExcelUrl: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @Column({ name: 'cree_par', type: 'varchar', nullable: true })
  creePar: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => LigneBordereauEntity, (ligne) => ligne.bordereau)
  lignes: LigneBordereauEntity[];

  @ManyToOne(() => ApporteurEntity)
  @JoinColumn({ name: 'apporteur_id' })
  apporteur: ApporteurEntity;
}
