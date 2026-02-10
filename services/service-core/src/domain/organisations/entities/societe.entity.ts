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
import { OrganisationEntity } from './organisation.entity';

@Entity('societes')
@Index(['organisationId'])
export class SocieteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'raison_sociale', type: 'varchar', length: 255 })
  raisonSociale: string;

  @Column({ type: 'varchar', length: 20 })
  siren: string;

  @Column({ name: 'numero_tva', type: 'varchar', length: 50 })
  numeroTva: string;

  // New enrichment fields
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'devise', type: 'varchar', length: 3, default: 'EUR' })
  devise: string;

  @Column({ name: 'ics', type: 'varchar', length: 50, nullable: true })
  ics: string | null;

  @Column({ name: 'journal_vente', type: 'varchar', length: 20, nullable: true })
  journalVente: string | null;

  @Column({ name: 'compte_produit_defaut', type: 'varchar', length: 20, nullable: true })
  compteProduitDefaut: string | null;

  @Column({ name: 'plan_comptable', type: 'jsonb', nullable: true })
  planComptable: Record<string, any> | null;

  @Column({ name: 'adresse_siege', type: 'text', nullable: true })
  adresseSiege: string | null;

  @Column({ name: 'telephone', type: 'varchar', length: 50, nullable: true })
  telephone: string | null;

  @Column({ name: 'email_contact', type: 'varchar', length: 255, nullable: true })
  emailContact: string | null;

  @Column({ name: 'parametres_fiscaux', type: 'jsonb', nullable: true })
  parametresFiscaux: Record<string, any> | null;

  // Audit fields
  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrganisationEntity)
  @JoinColumn({ name: 'organisation_id' })
  organisation: OrganisationEntity;
}
