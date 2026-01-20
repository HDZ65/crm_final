import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ApporteurEntity } from './apporteur.entity';
import { SocieteEntity } from './societe.entity';
import { LigneContratEntity } from './ligne-contrat.entity';
import { HistoriqueStatutContratEntity } from './historique-statut-contrat.entity';

@Entity('contrats')
export class ContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column({ type: 'varchar' })
  reference: string;

  @Column({ type: 'varchar', nullable: true })
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'varchar' })
  statut: string;

  @Column({ type: 'varchar' })
  dateDebut: string;

  @Column({ type: 'varchar', nullable: true })
  dateFin: string;

  @Column({ type: 'varchar', nullable: true })
  dateSignature: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant: number;

  @Column({ type: 'varchar', nullable: true, default: 'EUR' })
  devise: string;

  @Column({ type: 'varchar', nullable: true })
  frequenceFacturation: string;

  @Column({ type: 'varchar', nullable: true })
  documentUrl: string;

  @Column({ type: 'varchar', nullable: true })
  fournisseur: string;

  @Column({ type: 'varchar' })
  clientId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: ClientBaseEntity;

  @Column({ type: 'varchar' })
  commercialId: string;

  @ManyToOne(() => ApporteurEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commercialId' })
  commercial: ApporteurEntity;

  @Column({ type: 'varchar', nullable: true })
  societeId: string;

  @ManyToOne(() => SocieteEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => LigneContratEntity, (ligneContrat) => ligneContrat.contrat)
  lignesContrat: LigneContratEntity[];

  @OneToMany(
    () => HistoriqueStatutContratEntity,
    (historique) => historique.contrat,
  )
  historiquesStatut: HistoriqueStatutContratEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
