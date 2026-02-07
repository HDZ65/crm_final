import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutContestation {
  EN_COURS = 'en_cours',
  ACCEPTEE = 'acceptee',
  REJETEE = 'rejetee',
}

@Entity('contestations_commission')
@Index(['organisationId', 'statut'])
@Index(['commissionId'])
@Index(['apporteurId', 'dateContestation'])
export class ContestationCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'commission_id', type: 'uuid' })
  commissionId: string;

  @Column({ name: 'bordereau_id', type: 'uuid' })
  bordereauId: string;

  @Column({ name: 'apporteur_id', type: 'uuid' })
  apporteurId: string;

  @Column({ type: 'text' })
  motif: string;

  @Column({ name: 'date_contestation', type: 'date' })
  dateContestation: Date;

  @Column({ name: 'date_limite', type: 'date' })
  dateLimite: Date;

  @Column({ type: 'enum', enum: StatutContestation, default: StatutContestation.EN_COURS })
  statut: StatutContestation;

  @Column({ name: 'commentaire_resolution', type: 'text', nullable: true })
  commentaireResolution: string | null;

  @Column({ name: 'resolu_par', type: 'varchar', length: 255, nullable: true })
  resoluPar: string | null;

  @Column({ name: 'date_resolution', type: 'timestamptz', nullable: true })
  dateResolution: Date | null;

  @Column({ name: 'ligne_regularisation_id', type: 'uuid', nullable: true })
  ligneRegularisationId: string | null;

  @Column({ name: 'statut_commission_precedent_id', type: 'uuid', nullable: true })
  statutCommissionPrecedentId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
