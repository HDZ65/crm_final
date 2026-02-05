import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutRecurrence {
  ACTIVE = 'active',
  SUSPENDUE = 'suspendue',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee',
}

@Entity('commissions_recurrentes')
@Index(['organisationId', 'contratId'])
@Index(['apporteurId', 'statutRecurrence'])
@Index(['periode'])
export class CommissionRecurrenteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'commission_initiale_id', type: 'uuid' })
  commissionInitialeId: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  @Index()
  contratId: string;

  @Column({ name: 'echeance_id', type: 'uuid', nullable: true })
  echeanceId: string | null;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  @Index()
  apporteurId: string;

  @Column({ name: 'bareme_id', type: 'uuid' })
  baremeId: string;

  @Column({ name: 'bareme_version', type: 'int' })
  baremeVersion: number;

  @Column({ type: 'varchar', length: 7 })
  periode: string;

  @Column({ name: 'numero_mois', type: 'int' })
  numeroMois: number;

  @Column({ name: 'montant_base', type: 'decimal', precision: 12, scale: 2 })
  montantBase: number;

  @Column({ name: 'taux_recurrence', type: 'decimal', precision: 5, scale: 2 })
  tauxRecurrence: number;

  @Column({ name: 'montant_calcule', type: 'decimal', precision: 12, scale: 2 })
  montantCalcule: number;

  @Column({
    name: 'statut_recurrence',
    type: 'enum',
    enum: StatutRecurrence,
    default: StatutRecurrence.ACTIVE,
  })
  statutRecurrence: StatutRecurrence;

  @Column({ name: 'bordereau_id', type: 'uuid', nullable: true })
  bordereauId: string | null;

  @Column({ name: 'date_encaissement', type: 'date', nullable: true })
  dateEncaissement: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
