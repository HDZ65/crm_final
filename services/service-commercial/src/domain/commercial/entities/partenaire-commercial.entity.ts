import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { PartenaireCommercialSocieteEntity } from './partenaire-commercial-societe.entity';

export enum TypePartenaire {
  ASSUREUR = 'ASSUREUR',
  FAI = 'FAI',
  ENERGIE = 'ENERGIE',
  OTT = 'OTT',
  MARKETPLACE = 'MARKETPLACE',
  COURTIER = 'COURTIER',
  FOURNISSEUR = 'FOURNISSEUR',
  AUTRE = 'AUTRE',
}

export enum StatutPartenaire {
  PROSPECT = 'PROSPECT',
  EN_COURS_INTEGRATION = 'EN_COURS_INTEGRATION',
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  RESILIE = 'RESILIE',
}

@Entity('partenaire_commercial')
@Index(['organisationId', 'type'])
@Index(['organisationId', 'statut'])
@Unique(['organisationId', 'denomination'])
export class PartenaireCommercialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  // --- Identification ---

  @Column({ type: 'varchar', length: 255 })
  denomination: string;

  @Column({ name: 'type', type: 'enum', enum: TypePartenaire })
  type: TypePartenaire;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siren: string | null;

  @Column({ type: 'varchar', length: 17, nullable: true })
  siret: string | null;

  @Column({ name: 'numero_tva', type: 'varchar', length: 20, nullable: true })
  numeroTva: string | null;

  // --- Adresses ---

  @Column({ type: 'jsonb', nullable: true })
  adresses: Record<string, any>[] | null;

  // --- Coordonnées bancaires ---

  @Column({ type: 'varchar', length: 34, nullable: true })
  iban: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bic: string | null;

  // --- Extranet & API ---

  @Column({ name: 'code_extranet', type: 'varchar', length: 100, nullable: true })
  codeExtranet: string | null;

  @Column({ name: 'api_base_url', type: 'varchar', length: 500, nullable: true })
  apiBaseUrl: string | null;

  // TODO: Encrypt with pgcrypto in future task
  @Column({ name: 'api_credentials', type: 'jsonb', nullable: true })
  apiCredentials: Record<string, any> | null;

  // --- SLA ---

  @Column({ name: 'sla_delai_traitement_heures', type: 'int', nullable: true })
  slaDelaiTraitementHeures: number | null;

  @Column({ name: 'sla_taux_disponibilite', type: 'decimal', precision: 5, scale: 2, nullable: true })
  slaTauxDisponibilite: number | null;

  @Column({ name: 'sla_contact_urgence', type: 'varchar', length: 255, nullable: true })
  slaContactUrgence: string | null;

  // --- Contacts ---

  @Column({ type: 'jsonb', nullable: true })
  contacts: Record<string, any>[] | null;

  // --- Statut & Contrat ---

  @Column({ type: 'enum', enum: StatutPartenaire, default: StatutPartenaire.PROSPECT })
  statut: StatutPartenaire;

  @Column({ name: 'date_debut_contrat', type: 'date', nullable: true })
  dateDebutContrat: Date | null;

  @Column({ name: 'date_fin_contrat', type: 'date', nullable: true })
  dateFinContrat: Date | null;

  // --- Notes & Metadata ---

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // --- Relations ---

  @OneToMany(() => PartenaireCommercialSocieteEntity, (ps) => ps.partenaire)
  societes: PartenaireCommercialSocieteEntity[];

  // --- Audit ---

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
