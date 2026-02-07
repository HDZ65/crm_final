import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('dossiers_declaratifs')
export class DossierDeclaratifEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'abonnement_id', type: 'uuid' })
  abonnementId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Index({ unique: true })
  @Column({ name: 'reference_externe', type: 'varchar', length: 255, unique: true })
  referenceExterne: string;

  @Column({ name: 'date_ouverture', type: 'timestamptz' })
  dateOuverture: Date;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 100, default: 'ENREGISTRE' })
  statut: string;

  @Column({ name: 'adresse_risque_id', type: 'uuid', nullable: true })
  adresseRisqueId: string | null;

  @Column({ name: 'montant_estimatif', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantEstimatif: number | null;

  @Column({ name: 'prise_en_charge', type: 'boolean', nullable: true })
  priseEnCharge: boolean | null;

  @Column({ name: 'franchise_appliquee', type: 'decimal', precision: 12, scale: 2, nullable: true })
  franchiseAppliquee: number | null;

  @Column({ name: 'reste_a_charge', type: 'decimal', precision: 12, scale: 2, nullable: true })
  resteACharge: number | null;

  @Column({ name: 'montant_pris_en_charge', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantPrisEnCharge: number | null;

  @Column({ name: 'nps_score', type: 'integer', nullable: true })
  npsScore: number | null;

  @Column({ name: 'nps_commentaire', type: 'text', nullable: true })
  npsCommentaire: string | null;

  @Column({ name: 'date_cloture', type: 'timestamptz', nullable: true })
  dateCloture: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
