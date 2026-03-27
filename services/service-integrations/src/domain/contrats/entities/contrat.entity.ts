import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { LigneContratEntity } from './ligne-contrat.entity';

@Entity('contrat')
@Index(['keycloakGroupId', 'reference'], { unique: true })
export class ContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId!: string;

  @Column({ type: 'varchar', length: 100 })
  reference!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titre!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type!: string | null;

  @Column({ type: 'varchar', length: 50 })
  statut!: string;

  @Column({ name: 'date_debut', type: 'date', nullable: true })
  dateDebut!: Date | null;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin!: Date | null;

  @Column({ name: 'date_signature', type: 'date', nullable: true })
  dateSignature!: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montant!: number | null;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  devise!: string;

  @Column({ name: 'frequence_facturation', type: 'varchar', length: 50, nullable: true })
  frequenceFacturation!: string | null;

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fournisseur!: string | null;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'commercial_id', type: 'uuid', nullable: true })
  commercialId!: string | null;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => LigneContratEntity, (ligne) => ligne.contrat)
  lignes!: Relation<LigneContratEntity[]>;
}
