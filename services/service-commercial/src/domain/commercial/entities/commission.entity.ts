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
import { StatutCommissionEntity } from './statut-commission.entity';

@Entity('commissions')
@Index(['organisationId', 'periode'])
@Index(['apporteurId', 'periode'])
export class CommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  @Index()
  apporteurId: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  @Index()
  contratId: string;

  @Column({ name: 'produit_id', type: 'uuid', nullable: true })
  produitId: string | null;

  @Column({ type: 'varchar', length: 255 })
  compagnie: string;

  @Column({ name: 'type_base', type: 'varchar', length: 50 })
  typeBase: string; // 'cotisation_ht', 'ca_ht', 'forfait'

  @Column({ name: 'montant_brut', type: 'decimal', precision: 12, scale: 2 })
  montantBrut: number;

  @Column({ name: 'montant_reprises', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantReprises: number;

  @Column({ name: 'montant_acomptes', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantAcomptes: number;

  @Column({ name: 'montant_net_a_payer', type: 'decimal', precision: 12, scale: 2 })
  montantNetAPayer: number;

  @Column({ name: 'statut_id', type: 'uuid' })
  statutId: string;

  @ManyToOne(() => StatutCommissionEntity)
  @JoinColumn({ name: 'statut_id' })
  statut: StatutCommissionEntity;

  @Column({ type: 'varchar', length: 7 })
  periode: string; // YYYY-MM

  @Column({ name: 'date_creation', type: 'date' })
  dateCreation: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
