import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ABONNEMENT_STATUS_ATTENTE = 'Attente';
export const ABONNEMENT_STATUS_ACTIF = 'Actif';
export const ABONNEMENT_STATUS_ERREUR_TECHNIQUE_LIGNE_INACTIVE =
  'Erreur Technique - Ligne Inactive';

export const PROVISIONING_STATE_EN_ATTENTE_RETRACTATION =
  'EN_ATTENTE_RETRACTATION';
export const PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE =
  'DELAI_RETRACTATION_ECOULE';
export const PROVISIONING_STATE_EN_COURS = 'EN_COURS';
export const PROVISIONING_STATE_ACTIVE = 'ACTIVE';
export const PROVISIONING_STATE_ERREUR_TECHNIQUE = 'ERREUR_TECHNIQUE';
export const PROVISIONING_STATE_SUSPENDU = 'SUSPENDU';
export const PROVISIONING_STATE_RESILIE = 'RESILIE';

export type ProvisioningState =
  | typeof PROVISIONING_STATE_EN_ATTENTE_RETRACTATION
  | typeof PROVISIONING_STATE_DELAI_RETRACTATION_ECOULE
  | typeof PROVISIONING_STATE_EN_COURS
  | typeof PROVISIONING_STATE_ACTIVE
  | typeof PROVISIONING_STATE_ERREUR_TECHNIQUE
  | typeof PROVISIONING_STATE_SUSPENDU
  | typeof PROVISIONING_STATE_RESILIE;

@Entity('provisioning_lifecycle')
@Index(['contratId'], { unique: true })
@Index(['dateFinRetractation'])
@Index(['provisioningState'])
export class ProvisioningLifecycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid', nullable: true })
  organisationId: string | null;

  @Column({ name: 'contrat_id', type: 'varchar', length: 120 })
  contratId: string;

  @Column({ name: 'client_id', type: 'varchar', length: 120 })
  clientId: string;

  @Column({ name: 'commercial_id', type: 'varchar', length: 120, nullable: true })
  commercialId: string | null;

  @Column({ name: 'date_signature', type: 'timestamptz' })
  dateSignature: Date;

  @Column({ name: 'date_fin_retractation', type: 'timestamptz' })
  dateFinRetractation: Date;

  @Column({
    name: 'abonnement_status',
    type: 'varchar',
    length: 120,
    default: ABONNEMENT_STATUS_ATTENTE,
  })
  abonnementStatus: string;

  @Column({
    name: 'provisioning_state',
    type: 'varchar',
    length: 60,
    default: PROVISIONING_STATE_EN_ATTENTE_RETRACTATION,
  })
  provisioningState: ProvisioningState;

  @Column({
    name: 'montant_abonnement',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  montantAbonnement: number;

  @Column({ name: 'devise', type: 'varchar', length: 10, default: 'EUR' })
  devise: string;

  @Column({ name: 'sepa_mandate_id', type: 'varchar', length: 120, nullable: true })
  sepaMandateId: string | null;

  @Column({
    name: 'gocardless_subscription_id',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  gocardlessSubscriptionId: string | null;

  @Column({ name: 'compensation_done', type: 'boolean', default: false })
  compensationDone: boolean;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
