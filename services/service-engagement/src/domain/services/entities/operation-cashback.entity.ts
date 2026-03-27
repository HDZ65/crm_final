import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CashbackStatut {
  EN_ATTENTE = 'en_attente',
  VALIDEE = 'validee',
  REJETEE = 'rejetee',
  VERSEE = 'versee',
  ANNULEE = 'annulee',
}

export enum CashbackType {
  ACHAT = 'achat',
  PARRAINAGE = 'parrainage',
  FIDELITE = 'fidelite',
  PROMOTION = 'promotion',
  AUTRE = 'autre',
}

@Entity('operation_cashback')
export class OperationCashback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ name: 'reference', unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: CashbackType,
    default: CashbackType.ACHAT,
  })
  type: CashbackType;

  @Column({
    type: 'enum',
    enum: CashbackStatut,
    default: CashbackStatut.EN_ATTENTE,
  })
  statut: CashbackStatut;

  @Column({ name: 'montant_achat', type: 'decimal', precision: 12, scale: 2 })
  montantAchat: number;

  @Column({ name: 'taux_cashback', type: 'decimal', precision: 5, scale: 2 })
  tauxCashback: number;

  @Column({ name: 'montant_cashback', type: 'decimal', precision: 12, scale: 2 })
  montantCashback: number;

  @Column({ name: 'date_achat', type: 'timestamp with time zone', nullable: true })
  dateAchat: Date;

  @Column({ name: 'date_validation', type: 'timestamp with time zone', nullable: true })
  dateValidation: Date;

  @Column({ name: 'date_versement', type: 'timestamp with time zone', nullable: true })
  dateVersement: Date;

  @Column({ name: 'valide_par', nullable: true })
  validePar: string;

  @Column({ name: 'cree_par', nullable: true })
  creePar: string;

  @Column({ name: 'partenaire_id', nullable: true })
  partenaireId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
