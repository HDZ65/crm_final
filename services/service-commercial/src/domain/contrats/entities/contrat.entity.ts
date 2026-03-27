import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LigneContratEntity } from './ligne-contrat.entity';
import { HistoriqueStatutContratEntity } from './historique-statut-contrat.entity';

@Entity('contrat')
@Index(['organisationId', 'reference'], { unique: true })
export class ContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ type: 'varchar', length: 100 })
  reference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titre: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 50 })
  statut: string;

  @Column({ name: 'date_debut', type: 'varchar', length: 50 })
  dateDebut: string;

  @Column({ name: 'date_fin', type: 'varchar', length: 50, nullable: true })
  dateFin: string | null;

  @Column({ name: 'date_signature', type: 'varchar', length: 50, nullable: true })
  dateSignature: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montant: number | null;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  devise: string;

  @Column({ name: 'frequence_facturation', type: 'varchar', length: 50, nullable: true })
  frequenceFacturation: string | null;

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fournisseur: string | null;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'commercial_id', type: 'uuid' })
  commercialId: string;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null;

   @Column({ type: 'text', nullable: true })
   notes: string | null;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'statut_cq', type: 'varchar', length: 20, nullable: true, default: 'EN_ATTENTE' })
  statutCq: string | null;

  @Column({ name: 'renewal_date', type: 'timestamptz', nullable: true })
  renewalDate: Date | null;

  @Column({ name: 'tacite_renewal_enabled', type: 'boolean', default: false })
  taciteRenewalEnabled: boolean;

  @Column({ name: 'renewal_status', type: 'varchar', length: 60, nullable: true })
  renewalStatus: string | null;

  @Column({ name: 'renewal_notification_j90_sent_at', type: 'timestamptz', nullable: true })
  renewalNotificationJ90SentAt: Date | null;

  @Column({ name: 'renewal_notification_j30_sent_at', type: 'timestamptz', nullable: true })
  renewalNotificationJ30SentAt: Date | null;

  @Column({ name: 'renewal_cancellation_deadline', type: 'timestamptz', nullable: true })
  renewalCancellationDeadline: Date | null;

  @OneToMany(() => LigneContratEntity, (ligne) => ligne.contrat)
  lignes: LigneContratEntity[];

  @OneToMany(() => HistoriqueStatutContratEntity, (hist) => hist.contrat)
  historique: HistoriqueStatutContratEntity[];
}
