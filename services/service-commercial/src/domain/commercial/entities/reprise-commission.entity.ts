import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeReprise {
  RESILIATION = 'resiliation',
  IMPAYE = 'impaye',
  ANNULATION = 'annulation',
  REGULARISATION = 'regularisation',
}

export enum StatutReprise {
  EN_ATTENTE = 'en_attente',
  APPLIQUEE = 'appliquee',
  ANNULEE = 'annulee',
}

@Entity('reprises_commission')
@Index(['organisationId', 'statutReprise'])
@Index(['apporteurId', 'periodeApplication'])
export class RepriseCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'commission_originale_id', type: 'uuid' })
  @Index()
  commissionOriginaleId: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  @Index()
  apporteurId: string;

  @Column({ type: 'varchar', length: 100 })
  reference: string;

  @Column({ name: 'type_reprise', type: 'enum', enum: TypeReprise })
  typeReprise: TypeReprise;

  @Column({ name: 'montant_reprise', type: 'decimal', precision: 10, scale: 2 })
  montantReprise: number;

  @Column({ name: 'taux_reprise', type: 'decimal', precision: 5, scale: 2, default: 100 })
  tauxReprise: number;

  @Column({ name: 'montant_original', type: 'decimal', precision: 10, scale: 2 })
  montantOriginal: number;

  @Column({ name: 'periode_origine', type: 'varchar', length: 7 })
  periodeOrigine: string;

  @Column({ name: 'periode_application', type: 'varchar', length: 7 })
  periodeApplication: string;

  @Column({ name: 'date_evenement', type: 'date' })
  dateEvenement: Date;

  @Column({ name: 'date_limite', type: 'date' })
  dateLimite: Date;

  @Column({ name: 'date_application', type: 'date', nullable: true })
  dateApplication: Date | null;

  @Column({
    name: 'statut_reprise',
    type: 'enum',
    enum: StatutReprise,
    default: StatutReprise.EN_ATTENTE,
  })
  statutReprise: StatutReprise;

  @Column({ name: 'bordereau_id', type: 'uuid', nullable: true })
  bordereauId: string | null;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
